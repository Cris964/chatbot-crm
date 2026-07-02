const fs = require('fs');
const content = fs.readFileSync('api/webhook.js', 'utf-8');
const lines = content.split('\n');

const startIndex = lines.findIndex(l => l.includes('// 4. AI Dispatch — DYNAMIC per-company'));
const endIndex = lines.findIndex(l => l.includes('const FB_TOKEN = clientSetup.facebook_access_token;'));

if (startIndex !== -1 && endIndex !== -1) {
    const replacement = `      // 4. AI Dispatch — Shared AI Helper
      const isNeedsHuman = existingChats?.[0]?.needs_human === true;
      let messageQueue = [];

      if (clients?.[0]?.active !== false && conversationId && !isNeedsHuman) {
          const { dispatchToAI } = await import('./_aiHelper.js');
          try {
              messageQueue = await dispatchToAI({
                  supabase,
                  clientId,
                  clientSetup: clients[0],
                  openRouterKey: process.env.OPENROUTER_API_KEY,
                  conversationId,
                  finalMessages,
                  senderName,
                  senderPhone,
                  channel
              });
          } catch(aiError) {
              console.error('[AI DISPATCH ERROR]', aiError);
              const { data: latest } = await supabase.from('conversations').select('messages').eq('id', conversationId).single();
              await supabase.from('conversations').update({
                  messages: [...(latest?.messages || []), { role: 'agent', content: \`[SISTEMA]: Error IA: \${aiError.message || aiError}\`, timestamp: new Date().toISOString() }],
                  updated_at: new Date().toISOString()
              }).eq('id', conversationId);
          }
      }

      // Enviar a WhatsApp / Messenger / Instagram
      const WHATSAPP_TOKEN = clients[0]?.whatsapp_token || process.env.WHATSAPP_TOKEN;
      const PHONE_NUMBER_ID = clients[0]?.phone_number_id || process.env.PHONE_NUMBER_ID;
      const FB_TOKEN = clients[0]?.facebook_access_token;`;

    const newLines = [
        ...lines.slice(0, startIndex),
        replacement,
        ...lines.slice(endIndex + 1)
    ];
    
    fs.writeFileSync('api/webhook.js', newLines.join('\n'));
    console.log('REPLACEMENT SUCCESSFUL');
} else {
    console.log('COULD NOT FIND INDICES', startIndex, endIndex);
}
