import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS Definitions
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Se recomienda proteger este endpoint con un cron secret token
  const CRON_SECRET = process.env.CRON_SECRET || 'nexus_cron_secret_123';
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${CRON_SECRET}` && req.query.token !== CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized CRON execution' });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      return res.status(500).json({ error: 'OpenRouter API Key is missing' });
    }

    console.log('[REMARKETING] Buscando conversaciones inactivas...');

    // Limites de tiempo: mayor a 5 horas, menor a 24 horas (para no revivir chats viejos)
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: conversations, error: convErr } = await supabase
      .from('conversations')
      .select('id, client_id, user_phone, user_name, messages, updated_at')
      .lt('updated_at', fiveHoursAgo)
      .gt('updated_at', twentyFourHoursAgo);

    if (convErr) {
      console.error('[REMARKETING DB ERROR]', convErr);
      return res.status(500).json({ error: 'DB Error', details: convErr });
    }

    let processedCount = 0;

    for (const chat of conversations) {
      const messages = chat.messages || [];
      if (messages.length === 0) continue;

      const lastMessage = messages[messages.length - 1];

      // Solo hacer remarketing si el último mensaje fue del agente 
      // (el cliente nos dejó "en visto") y si no es ya un mensaje de remarketing
      if (lastMessage.role === 'agent' && !(lastMessage.meta_id && lastMessage.meta_id.startsWith('REMARKETING_'))) {
        
        // Obtener la info del cliente (Trazzos, Naturel, etc.)
        const { data: clientSetup } = await supabase
          .from('clients')
          .select('id, name, prompt, whatsapp_token, phone_number_id, active')
          .eq('id', chat.client_id)
          .single();

        if (!clientSetup || !clientSetup.active) continue;

        console.log(`[REMARKETING] Ejecutando seguimiento para ${chat.user_name} (${chat.user_phone}) - Empresa: ${clientSetup.name}`);

        const remarketingSystemMsg = `[SISTEMA]: Han pasado 5 horas desde que enviaste tu último mensaje y el cliente (${chat.user_name}) no ha respondido. 
REGLAS PARA TU RESPUESTA:
1. Redacta UN SOLO MENSAJE CORTO, sutil y muy amable para retomar la conversación.
2. Pregunta si tiene alguna duda con lo que le enviaste anteriormente, si logró revisar la información o si quiere que le ayudes agendando una visita/reunión.
3. No seas insistente ni parezcas un bot. Sé casual (ej. "Hola [Nombre], pasaba por aquí para saber si lograste revisar...").
4. Recuerda NO enviar párrafos largos.`;

        const aiMessages = [
          { role: 'system', content: clientSetup.prompt },
          ...messages.slice(-8).map(m => ({
            role: m.role === 'agent' ? 'assistant' : 'user',
            content: m.content
          })),
          { role: 'system', content: remarketingSystemMsg }
        ];

        // Llamar a OpenRouter para generar el mensaje de seguimiento
        const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://chatbot-crm-xi.vercel.app/',
            'X-Title': `NexusCRM - Remarketing - ${clientSetup.name}`
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            messages: aiMessages,
            max_tokens: 300
          })
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const botReplyText = aiData.choices?.[0]?.message?.content;

          if (botReplyText) {
            let cleanReply = botReplyText.replace('[NEEDS_HUMAN]', '').trim();

            const newMsgNode = {
              role: 'agent',
              content: cleanReply,
              timestamp: new Date().toISOString(),
              meta_id: 'REMARKETING_' + Date.now() // Marcar para no hacer loop
            };

            // Guardar en Supabase
            await supabase.from('conversations').update({
              messages: [...messages, newMsgNode],
              updated_at: new Date().toISOString()
            }).eq('id', chat.id);

            // Enviar por WhatsApp
            if (clientSetup.whatsapp_token && clientSetup.phone_number_id) {
              await fetch(`https://graph.facebook.com/v21.0/${clientSetup.phone_number_id}/messages`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${clientSetup.whatsapp_token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  messaging_product: 'whatsapp',
                  to: chat.user_phone,
                  type: 'text',
                  text: { body: cleanReply }
                })
              });
            }

            processedCount++;
          }
        }
      }
    }

    return res.status(200).json({ success: true, processed_count: processedCount });

  } catch (error) {
    console.error('[REMARKETING EXCEPTION]', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
