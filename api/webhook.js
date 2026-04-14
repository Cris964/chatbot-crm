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

  // META WEBHOOK VERIFICATION (Fase 1)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Este es el token que el usuario pega en la casilla de Meta Developers
    const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'nexus_secure_123';

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      return res.status(200).send(challenge);
    } else {
      return res.status(403).json({ error: 'Verification failed' });
    }
  }

  // INCOMING MESSAGES (Fase 2)
  if (req.method === 'POST') {
    try {
      const body = req.body;

      // Checking if this is an Event from WhatsApp
      if (body.object !== 'whatsapp_business_account') {
        return res.status(404).send('Not a WhatsApp event');
      }

      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0]?.value;

      // Filter out empty payloads or status updates for now
      if (!changes || !changes.messages || changes.messages.length === 0) {
        return res.status(200).send('No message payload');
      }

      const messageObj = changes.messages[0];
      const contactObj = changes.contacts?.[0];
      const phoneNumberId = changes.metadata.phone_number_id;

      const senderPhone = messageObj.from;
      const senderName = contactObj?.profile?.name || 'Cliente';
      const textResponse = messageObj.text?.body || '[Multimedia/No Text]';

      console.log(`[WHATSAPP WEBHOOK] Nuevo mensaje de ${senderName} (${senderPhone}): ${textResponse}`);

      // Instanciamos Supabase desde el Edge
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      const supabase = createClient(supabaseUrl, supabaseKey);

      // 1. Identificar de qué empresa/tenant es el webhook según el `phone_number_id` al que escribieron
      const { data: clients, error: clientErr } = await supabase
        .from('clients')
        .select('id, user_id, active, prompt, model, whatsapp_token')
        .eq('phone_number_id', phoneNumberId)
        .limit(1);

      if (clientErr) console.error("Error fetching client:", clientErr);

      // Fallback a un ID genérico por si no encuentra el número de teléfono
      // (Para no perder el log en caso de que Meta mande algo que no coincida).
      let clientId = null;
      let userId = null;
      if (clients && clients.length > 0) {
        clientId = clients[0].id;
        userId = clients[0].user_id;
      }

      // 2. Buscar si la conversación del cliente ya existe
      let query = supabase.from('conversations').select('id, messages, needs_human');
      
      // Asegurar que asociamos la conversación a la empresa correcta.
      // Si clientId es nulo (no sabemos a quién escribió), buscamos globalmente.
      if (clientId) {
          query = query.eq('client_id', clientId).eq('user_phone', senderPhone).limit(1);
      } else {
          query = query.eq('user_phone', senderPhone).limit(1);
      }

      let { data: existingChats, error: chatErr } = await query;

      if (chatErr) throw chatErr;

      const newMsgNode = {
        role: 'user',
        content: textResponse,
        timestamp: new Date().toISOString()
      };

      let shouldTriggerBot = false;
      let finalMessages = [];

      if (existingChats && existingChats.length > 0) {
        // ACTUALIZAR CONVERSACIÓN EXISTENTE
        const chat = existingChats[0];
        finalMessages = [...(chat.messages || []), newMsgNode];

        await supabase
          .from('conversations')
          .update({
             messages: finalMessages,
             updated_at: new Date().toISOString()
          })
          .eq('id', chat.id);
        
        console.log(`Conversación ${chat.id} actualizada exitosamente.`);
        if (!chat.needs_human) shouldTriggerBot = true;
      } else {
        // CREAR NUEVA CONVERSACIÓN
        finalMessages = [newMsgNode];
        const newChatPayload = {
          user_phone: senderPhone,
          user_name: senderName,
          messages: finalMessages
        };

        if (clientId) newChatPayload.client_id = clientId;
        if (userId) newChatPayload.user_id = userId;

        const { data: insertedChat } = await supabase
          .from('conversations')
          .insert([newChatPayload])
          .select('id')
          .single();
          
        if (insertedChat) existingChats = [insertedChat];
        console.log(`Nueva conversación registrada en CRM.`);
        shouldTriggerBot = true;
      }

      // Check if Client Bot is globally active
      if (clients && clients.length > 0 && clients[0].active === false) {
          shouldTriggerBot = false;
      }

      // ==========================================
      // FASE 3: OPENAI / OPENROUTER (SEGURO)
      // ==========================================
      
      if (clients && clients.length > 0) {
        const clientSetup = clients[0];
        // SEGURIDAD: Solo usamos variables de entorno de Vercel
        const openRouterKey = process.env.OPENROUTER_API_KEY;
        const conversationId = existingChats?.[0]?.id;

        const logErrorToCRM = async (logText) => {
            if (!conversationId) return;
            const { data: latest } = await supabase.from('conversations').select('messages').eq('id', conversationId).single();
            const currentMsgs = latest?.messages || finalMessages;
            await supabase.from('conversations').update({
                messages: [...currentMsgs, { role: 'agent', content: `[SISTEMA]: ${logText}`, timestamp: new Date().toISOString() }],
                updated_at: new Date().toISOString()
            }).eq('id', conversationId);
        };

        if (openRouterKey && clientSetup.prompt) {
            try {
                const oaiMessages = [
                    { role: 'system', content: clientSetup.prompt },
                    ...finalMessages.slice(-10).map(m => ({
                        role: m.role === 'agent' ? 'assistant' : 'user',
                        content: m.content
                    }))
                ];

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
                        messages: oaiMessages,
                        max_tokens: 400
                    })
                });

                if (!aiResponse.ok) {
                    const errData = await aiResponse.text();
                    await logErrorToCRM(`Error IA: ${errData}`);
                } else {
                    const aiData = await aiResponse.json();
                    const botReplyText = aiData.choices?.[0]?.message?.content;
                    
                    if (botReplyText) {
                        // 1. Guardar respuesta limpia en CRM
                        const botMsgNode = { role: 'agent', content: botReplyText, timestamp: new Date().toISOString() };
                        const { data: latestChat } = await supabase.from('conversations').select('messages').eq('id', conversationId).single();
                        
                        await supabase.from('conversations').update({
                            messages: [...(latestChat?.messages || finalMessages), botMsgNode],
                            updated_at: new Date().toISOString()
                        }).eq('id', conversationId);

                        // 2. Envío directo a WhatsApp (Sincronizado con api/send.js y actualizado a v20.0)
                        const WHATSAPP_TOKEN = clientSetup.whatsapp_token || process.env.WHATSAPP_TOKEN;
                        const PHONE_NUMBER_ID = clientSetup.phone_number_id || process.env.PHONE_NUMBER_ID;

                        if (WHATSAPP_TOKEN && PHONE_NUMBER_ID) {
                            const metaRes = await fetch(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({
                                messaging_product: 'whatsapp',
                                to: senderPhone,
                                type: 'text',
                                text: {
                                  preview_url: false,
                                  body: botReplyText
                                }
                              })
                            });

                            if (!metaRes.ok) {
                                const metaErr = await metaRes.text();
                                await logErrorToCRM(`Error Meta: ${metaErr}`);
                                
                                await supabase.from('outbox').insert([{
                                    client_id: clientId,
                                    user_id: userId,
                                    phone: senderPhone,
                                    user_phone: senderPhone,
                                    message: botReplyText,
                                    status: 'error',
                                    error: metaErr,
                                    sent_at: new Date().toISOString()
                                }]);
                            } else {
                                await supabase.from('outbox').insert([{
                                    client_id: clientId,
                                    user_id: userId,
                                    phone: senderPhone,
                                    user_phone: senderPhone,
                                    message: botReplyText,
                                    status: 'sent',
                                    sent_at: new Date().toISOString()
                                }]);
                            }
                        } else {
                             await logErrorToCRM("No se encontró WHATSAPP_TOKEN o PHONE_NUMBER_ID para este cliente.");
                        }
                    }
                }
            } catch (aiErr) {
                await logErrorToCRM(`Error Crítico Interno: ${aiErr.message}`);
            }
        } else {
            if (!openRouterKey) {
                await logErrorToCRM("ERROR SEGURIDAD: La variable OPENROUTER_API_KEY no está configurada en Vercel.");
            }
        }
      }

      // Devolver Status 200 INMEDIATO a Meta
      return res.status(200).send('EVENT_RECEIVED');

    } catch (e) {
      console.error("[WEBHOOK EXCEPTION]", e);
      return res.status(500).json({ error: 'Internal logic fail' });
    }
  }

  return res.status(405).send('Method Not Allowed');
}
