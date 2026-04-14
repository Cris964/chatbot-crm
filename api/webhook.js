import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS Definitions
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // META WEBHOOK VERIFICATION
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'nexus_secure_123';

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      return res.status(200).send(challenge);
    } else {
      return res.status(403).json({ error: 'Verification failed' });
    }
  }

  // INCOMING MESSAGES
  if (req.method === 'POST') {
    try {
      const body = req.body;
      if (body.object !== 'whatsapp_business_account') {
        return res.status(404).send('Not a WhatsApp event');
      }

      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0]?.value;

      if (!changes || !changes.messages || changes.messages.length === 0) {
        return res.status(200).send('No message payload');
      }

      const messageObj = changes.messages[0];
      const contactObj = changes.contacts?.[0];
      const phoneNumberId = changes.metadata.phone_number_id;

      const senderPhone = messageObj.from;
      const senderName = contactObj?.profile?.name || 'Cliente';
      const textResponse = messageObj.text?.body || '[Multimedia/No Text]';
      const messageId = messageObj.id;

      console.log(`[WHATSAPP WEBHOOK] Nuevo mensaje de ${senderName} (${senderPhone}) ID: ${messageId}: ${textResponse}`);

      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // --- ESCUDO ATÓMICO ---
      try {
        const { error: lockError } = await supabase
          .from('processed_messages')
          .insert([{ id: messageId }]);
        
        if (lockError && lockError.code === '23505') { 
            console.log(`[BLOQUEO ATÓMICO] Mensaje ${messageId} ya en proceso. Abortando.`);
            return res.status(200).send('ALREADY_PROCESSING');
        }
      } catch (e) {
        console.error('[LOCK EXCEPTION]', e);
      }

      // 1. Identificar cliente
      const { data: clients } = await supabase
        .from('clients')
        .select('id, user_id, active, prompt, model, whatsapp_token')
        .eq('phone_number_id', phoneNumberId)
        .limit(1);

      let clientId = null;
      let userId = null;
      if (clients && clients.length > 0) {
        clientId = clients[0].id;
        userId = clients[0].user_id;
      }

      // 2. Gestionar Conversación
      let { data: existingChats, error: chatErr } = await supabase
        .from('conversations')
        .select('id, messages, needs_human')
        .eq('client_id', clientId || '')
        .eq('user_phone', senderPhone)
        .limit(1);

      if (chatErr) throw chatErr;

      const newMsgNode = {
        role: 'user',
        content: textResponse,
        timestamp: new Date().toISOString(),
        meta_id: messageId
      };

      let finalMessages = [];
      let conversationId = null;

      if (existingChats && existingChats.length > 0) {
        const chat = existingChats[0];
        // Idempotencia Backup
        if ((chat.messages || []).some(m => m.meta_id === messageId)) {
          return res.status(200).send('DUPLICATE_IGNORED');
        }

        finalMessages = [...(chat.messages || []), newMsgNode];
        await supabase.from('conversations').update({
             messages: finalMessages,
             updated_at: new Date().toISOString()
        }).eq('id', chat.id);
        conversationId = chat.id;
      } else {
        finalMessages = [newMsgNode];
        const { data: insertedChat } = await supabase.from('conversations').insert([{
          user_phone: senderPhone,
          user_name: senderName,
          messages: finalMessages,
          client_id: clientId,
          user_id: userId
        }]).select('id').single();
        conversationId = insertedChat?.id;
      }

      // 3. AI Dispatch (SARA)
      if (clients?.[0]?.active !== false && conversationId) {
        const clientSetup = clients[0];
        const openRouterKey = process.env.OPENROUTER_API_KEY;

        const logErrorToCRM = async (logText) => {
            const { data: latest } = await supabase.from('conversations').select('messages').eq('id', conversationId).single();
            await supabase.from('conversations').update({
                messages: [...(latest?.messages || []), { role: 'agent', content: `[SISTEMA]: ${logText}`, timestamp: new Date().toISOString() }],
                updated_at: new Date().toISOString()
            }).eq('id', conversationId);
        };

        if (openRouterKey && clientSetup.prompt) {
            try {
                const inventoryContext = `
PRODUCTOS DISPONIBLES EN NATUREL:
- KOLOSAL: Limpieza profunda de colon, mejora digestión y estreñimiento.
- MR. FIBRA (Té Verde o Ciruela): Fibra natural de linaza y psyllium para tránsito intestinal.
- BERENLIN: Antioxidante potente, ayuda a la salud de la piel y control de peso.
- CIR/LAN: Mejora la circulación y depuración de la sangre.
- BRIL-PROS: Salud de la próstata y sistema urinario.
- OXTMAX: Regenerador de cartílagos y salud articular.
- 7 TOROS: Energizante natural y vigorizante.

REGLAS: Solo recomienda estos productos reales. Responde de forma amable y profesional.
`;
                const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${openRouterKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://chatbot-crm-xi.vercel.app/',
                        'X-Title': 'NexusCRM Sara'
                    },
                    body: JSON.stringify({
                        model: 'openai/gpt-4o-mini',
                        messages: [
                            { role: 'system', content: `${clientSetup.prompt}\n\n${inventoryContext}` },
                            ...finalMessages.slice(-10).map(m => ({
                                role: m.role === 'agent' ? 'assistant' : 'user',
                                content: m.content
                            }))
                        ],
                        max_tokens: 400
                    })
                });

                if (aiResponse.ok) {
                    const aiData = await aiResponse.json();
                    const botReplyText = aiData.choices?.[0]?.message?.content;
                    
                    if (botReplyText) {
                        // Guardar en CRM
                        const { data: latest } = await supabase.from('conversations').select('messages').eq('id', conversationId).single();
                        await supabase.from('conversations').update({
                            messages: [...(latest?.messages || []), { role: 'agent', content: botReplyText, timestamp: new Date().toISOString() }],
                            updated_at: new Date().toISOString()
                        }).eq('id', conversationId);

                        // Enviar a WhatsApp
                        const WHATSAPP_TOKEN = clientSetup.whatsapp_token || process.env.WHATSAPP_TOKEN;
                        const PHONE_NUMBER_ID = clientSetup.phone_number_id || process.env.PHONE_NUMBER_ID;

                        if (WHATSAPP_TOKEN && PHONE_NUMBER_ID) {
                            await fetch(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({
                                messaging_product: 'whatsapp',
                                to: senderPhone,
                                type: 'text',
                                text: { preview_url: false, body: botReplyText }
                              })
                            });
                        }
                    }
                } else {
                    const err = await aiResponse.text();
                    await logErrorToCRM(`Error IA: ${err}`);
                }
            } catch (aiErr) {
                await logErrorToCRM(`Error Crítico: ${aiErr.message}`);
            }
        }
      }

      return res.status(200).send('EVENT_RECEIVED');

    } catch (e) {
      console.error("[WEBHOOK EXCEPTION]", e);
      return res.status(500).json({ error: 'Internal logic fail' });
    }
  }

  return res.status(405).send('Method Not Allowed');
}
