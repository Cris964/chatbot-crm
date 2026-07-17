import { createClient } from '@supabase/supabase-js';
import { processMediaMessage } from './_mediaHelper.js';

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
      if (!['whatsapp_business_account', 'page', 'instagram'].includes(body.object)) {
        return res.status(404).send('Event not supported');
      }

      let messageObj, senderPhone, senderName, recipientId, channel;
      const entry = body.entry?.[0];

      if (body.object === 'whatsapp_business_account') {
          const changes = entry?.changes?.[0]?.value;
          if (!changes || !changes.messages || changes.messages.length === 0) return res.status(200).send('No message payload');
          messageObj = changes.messages[0];
          senderPhone = messageObj.from;
          senderName = changes.contacts?.[0]?.profile?.name || 'Cliente';
          recipientId = changes.metadata?.phone_number_id;
          channel = 'whatsapp';
      } else if (body.object === 'page' || body.object === 'instagram') {
          const messaging = entry?.messaging?.[0];
          if (!messaging || (!messaging.message && !messaging.postback)) return res.status(200).send('No message');
          
          messageObj = messaging.message || { text: messaging.postback?.payload || '' };
          messageObj.id = messageObj.mid || `mid.${Date.now()}`;
          messageObj.from = messaging.sender.id;
          
          if (messageObj.text && !messageObj.type) {
              messageObj.type = 'text';
              messageObj.text = { body: messageObj.text };
          }
          
          senderPhone = messaging.sender.id; // PSID / IGSID
          senderName = 'Cliente (Redes)';
          recipientId = messaging.recipient.id;
          channel = body.object === 'page' ? 'messenger' : 'instagram';
      }
      
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const supabase = createClient(supabaseUrl, supabaseKey);

      let textResponse = messageObj.text?.body;
      
      // Manejo Multimedia (Audio / Imagen / Video)
      if (!textResponse && messageObj.type !== 'text') {
        try {
            const tempClient = await supabase.from('clients').select('*').eq('phone_number_id', recipientId).single();
            const whatsappToken = tempClient?.data?.whatsapp_token;
            const openAiKey = tempClient?.data?.openai_key || process.env.OPENAI_API_KEY;
            
            if (whatsappToken) {
               const mediaResult = await processMediaMessage(messageObj, whatsappToken, openAiKey, supabase);
               if (typeof mediaResult === 'object' && mediaResult !== null) {
                  textResponse = mediaResult.text;
                  messageObj._mediaUrl = mediaResult.mediaUrl;
                  messageObj._mediaType = mediaResult.mediaType;
               } else {
                  textResponse = mediaResult;
               }
            } else {
               textResponse = '[Multimedia: No se pudo obtener token para descargar]';
            }
        } catch (mediaError) {
            textResponse = `[DEBUG MEDIA ERROR]: ${mediaError.message}`;
        }
      } else if (!textResponse) {
        textResponse = `[DEBUG FALLBACK PAYLOAD]: ${JSON.stringify(messageObj)}`;
      }
      const messageId = messageObj.id;

      console.log(`[WHATSAPP WEBHOOK] Nuevo mensaje de ${senderName} (${senderPhone}) ID: ${messageId}: ${textResponse}`);

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

      // 1. Identificar cliente por recipientId (multi-tenant)
      console.log(`[DEBUG] recipientId recibido: "${recipientId}" - Canal: ${channel}`);
      console.log(`[DEBUG] supabaseUrl: ${supabaseUrl ? 'SET' : 'MISSING'}`);
      console.log(`[DEBUG] supabaseKey type: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : 'ANON'}`);

      let clientQuery = supabase.from('clients')
        .select('id, user_id, active, prompt, model, whatsapp_token, name, phone_number_id, facebook_page_id, instagram_account_id, facebook_access_token')
        .or(`phone_number_id.eq.${recipientId},facebook_page_id.eq.${recipientId},instagram_account_id.eq.${recipientId}`);
      
      const { data: clients, error: clientErr } = await clientQuery.limit(1);

      console.log(`[DEBUG] clients encontrados: ${clients?.length || 0}, error: ${clientErr?.message || 'none'}`);

      let clientId = null;
      let userId = null;
      if (clients && clients.length > 0) {
        clientId = clients[0].id;
        userId = clients[0].user_id;
        console.log(`[DEBUG] clientId: ${clientId}`);
        
        if (channel === 'messenger' && clients[0].facebook_access_token && senderName === 'Cliente (Redes)') {
            try {
                const fbRes = await fetch(`https://graph.facebook.com/${senderPhone}?fields=first_name,last_name&access_token=${clients[0].facebook_access_token}`);
                const fbData = await fbRes.json();
                if (fbData && fbData.first_name) {
                    senderName = `${fbData.first_name} ${fbData.last_name || ''}`.trim();
                }
            } catch (e) {
                console.error('[FB GRAPH API ERROR]', e);
            }
        }
      } else {
        // Fallback: si no hay match por phone_number_id, listar todos los clientes para debug
        const { data: allClients } = await supabase.from('clients').select('id, name, phone_number_id').limit(10);
        console.log(`[DEBUG] Todos los clientes en DB: ${JSON.stringify(allClients)}`);
      }

      if (!clientId) {
        console.error(`[WEBHOOK ERROR] No se encontró cliente para recipientId: ${recipientId} (Channel: ${channel}). Ignorando.`);
        // Escribir a la base de datos para debugging
        try { await supabase.from('processed_messages').insert([{ id: `DEBUG_MISSING_ID_${recipientId}` }]); } catch(e){}
        return res.status(200).send('CLIENT_NOT_FOUND');
      }

      // 2. Gestionar Conversación
      let { data: existingChats, error: chatErr } = await supabase
        .from('conversations')
        .select('id, messages, needs_human')
        .eq('client_id', clientId || '')
        .eq('user_phone', senderPhone)
        .limit(1);

      if (chatErr) throw chatErr;

      let finalMessages = [];
      let conversationId = null;

      // Detectar si es una respuesta (Reply)
      let quotedText = '';
      if (messageObj.context && messageObj.context.id && existingChats && existingChats.length > 0) {
        const chat = existingChats[0];
        const quotedMsg = (chat.messages || []).find(m => m.meta_id === messageObj.context.id);
        if (quotedMsg) {
          if (quotedMsg.media_url && quotedMsg.media_type === 'image') {
            quotedText = `\n\n> ↩️ *Respondiendo a imagen:*\n[SEND_IMAGE: ${quotedMsg.media_url}]`;
          } else if ((quotedMsg.content || quotedMsg.text || '').includes('[SEND_IMAGE:')) {
            const match = (quotedMsg.content || quotedMsg.text || '').match(/\[SEND_IMAGE:\s*(https?:\/\/[^\]]+)\]/i);
            if (match) {
              quotedText = `\n\n> ↩️ *Respondiendo a imagen:*\n[SEND_IMAGE: ${match[1]}]`;
            } else {
              const shortText = (quotedMsg.content || quotedMsg.text || '').substring(0, 30).replace(/\n/g, ' ');
              quotedText = `\n\n> ↩️ *Respondiendo a:* "${shortText}..."`;
            }
          } else {
            const shortText = (quotedMsg.content || quotedMsg.text || '').substring(0, 30).replace(/\n/g, ' ');
            quotedText = `\n\n> ↩️ *Respondiendo a:* "${shortText}..."`;
          }
        } else {
          quotedText = `\n\n> ↩️ *Respondiendo a un mensaje anterior*`;
        }
      }

      const newMsgNode = {
        role: 'user',
        content: (textResponse || '') + quotedText,
        timestamp: new Date().toISOString(),
        meta_id: messageId,
        ...(messageObj._mediaUrl && { media_url: messageObj._mediaUrl }),
        ...(messageObj._mediaType && { media_type: messageObj._mediaType })
      };

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
          user_id: userId,
          channel: channel
        }]).select('id').single();
        conversationId = insertedChat?.id;
      }

      // 3. AUTO-CREATE LEAD — Siempre que llegue un mensaje, upsert al pipeline
      if (clientId) {
        try {
          const { data: existingLead } = await supabase
            .from('leads')
            .select('id')
            .eq('client_id', clientId)
            .eq('phone', senderPhone)
            .maybeSingle();
          
          if (existingLead) {
            // Actualizar nombre si cambió
            await supabase.from('leads').update({ name: senderName }).eq('id', existingLead.id);
          } else {
            // Crear nuevo lead automáticamente
            await supabase.from('leads').insert([{
              client_id: clientId,
              phone: senderPhone,
              name: senderName,
              stage: 'Nuevo',
              score: 5,
              source: channel === 'whatsapp' ? 'WhatsApp' : channel === 'messenger' ? 'Messenger' : 'Instagram',
              value: '$0',
              status: 'active'
            }]);
            console.log(`[LEAD CREADO] ${senderName} (${senderPhone}) → Nuevo`);
          }
        } catch(leadErr) {
          console.error('[LEAD AUTO-CREATE ERROR]', leadErr);
        }
      }

      // 4. AI Dispatch — Shared AI Helper
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
                  messages: [...(latest?.messages || []), { role: 'agent', content: `[SISTEMA]: Error IA: ${aiError.message || aiError}`, timestamp: new Date().toISOString() }],
                  updated_at: new Date().toISOString()
              }).eq('id', conversationId);
          }
      }

      // Enviar a WhatsApp / Messenger / Instagram
      const WHATSAPP_TOKEN = clients[0]?.whatsapp_token || process.env.WHATSAPP_TOKEN;
      const PHONE_NUMBER_ID = clients[0]?.phone_number_id || process.env.PHONE_NUMBER_ID;
      const FB_TOKEN = clients[0]?.facebook_access_token;

      for (const msg of messageQueue) {
          if (channel === 'whatsapp' && WHATSAPP_TOKEN && PHONE_NUMBER_ID) {
              if (msg.type === 'text') {
                  await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messaging_product: 'whatsapp', to: senderPhone, type: 'text', text: { body: msg.content } })
                  }).then(async r => {
                      if (!r.ok) {
                          const errData = await r.json();
                          console.error('[WHATSAPP TEXT ERROR]', errData);
                      }
                  });
              } else if (msg.type === 'image' || msg.type === 'video') {
                  const payload = { messaging_product: 'whatsapp', to: senderPhone, type: msg.type };
                  payload[msg.type] = { link: msg.content };
                  
                  await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                  }).then(async res => {
                    if (!res.ok) {
                        const errData = await res.json();
                        console.error(`[WHATSAPP ${msg.type.toUpperCase()} ERROR]`, errData);
                        await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ messaging_product: 'whatsapp', to: senderPhone, type: 'text', text: { body: `*(Error de sistema: No se pudo cargar el archivo multimedia)*` } })
                        });
                    }
                  }).catch(e => console.error('Media send error', e));
              }
          } else if ((channel === 'messenger' || channel === 'instagram') && FB_TOKEN) {
              let payload = { recipient: { id: senderPhone }, message: {} };
              if (msg.type === 'text') {
                  payload.message.text = msg.content;
              } else if (msg.type === 'image' || msg.type === 'video') {
                  payload.message.attachment = {
                      type: msg.type,
                      payload: { url: msg.content, is_reusable: true }
                  };
              }
              
              await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${FB_TOKEN}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
              }).then(async r => {
                  if (!r.ok) {
                      const errData = await r.json();
                      console.error(`[${channel.toUpperCase()} SEND ERROR]`, errData);
                  }
              }).catch(e => console.error('FB Media send error', e));
          } // closes else if channel === messenger
          
          const delay = msg.type === 'text' ? Math.max(2000, Math.min(3500, msg.content.length * 15)) : 1500;
          await new Promise(r => setTimeout(r, delay));
      } // closes for (const msg)

      return res.status(200).send('EVENT_RECEIVED');

  } catch (error) {
      console.error('[FATAL WEBHOOK ERROR]', error);
      return res.status(500).json({ error: 'Internal logic fail', details: error.message, stack: error.stack });
  }
} // closes if (req.method === 'POST')

return res.status(405).send('Method Not Allowed');
}