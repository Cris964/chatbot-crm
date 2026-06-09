import { createClient } from '@supabase/supabase-js';
import { processMediaMessage } from './mediaHelper.js';

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
      
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const supabase = createClient(supabaseUrl, supabaseKey);

      let textResponse = messageObj.text?.body;
      
      // Manejo Multimedia (Audio / Imagen / Video)
      if (!textResponse && messageObj.type !== 'text') {
        try {
            const tempClient = await supabase.from('clients').select('*').eq('phone_number_id', phoneNumberId).single();
            const whatsappToken = tempClient?.data?.whatsapp_token;
            const openAiKey = tempClient?.data?.openai_key || process.env.OPENAI_API_KEY;
            
            if (whatsappToken) {
               const mediaResult = await processMediaMessage(messageObj, whatsappToken, openAiKey);
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

      // 1. Identificar cliente por phone_number_id (multi-tenant)
      console.log(`[DEBUG] phoneNumberId recibido: "${phoneNumberId}"`);
      console.log(`[DEBUG] supabaseUrl: ${supabaseUrl ? 'SET' : 'MISSING'}`);
      console.log(`[DEBUG] supabaseKey type: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : 'ANON'}`);

      const { data: clients, error: clientErr } = await supabase
        .from('clients')
        .select('id, user_id, active, prompt, model, whatsapp_token, name, phone_number_id')
        .eq('phone_number_id', phoneNumberId)
        .limit(1);

      console.log(`[DEBUG] clients encontrados: ${clients?.length || 0}, error: ${clientErr?.message || 'none'}`);

      let clientId = null;
      let userId = null;
      if (clients && clients.length > 0) {
        clientId = clients[0].id;
        userId = clients[0].user_id;
        console.log(`[DEBUG] clientId: ${clientId}`);
      } else {
        // Fallback: si no hay match por phone_number_id, listar todos los clientes para debug
        const { data: allClients } = await supabase.from('clients').select('id, name, phone_number_id').limit(10);
        console.log(`[DEBUG] Todos los clientes en DB: ${JSON.stringify(allClients)}`);
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
        meta_id: messageId,
        ...(messageObj._mediaUrl && { media_url: messageObj._mediaUrl }),
        ...(messageObj._mediaType && { media_type: messageObj._mediaType })
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

      // 4. AI Dispatch — DYNAMIC per-company (no more hardcoded Naturel products)
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
                // ========== DYNAMIC INVENTORY LOADING ==========
                const { data: companyProducts } = await supabase
                  .from('products')
                  .select('name, description, price, category, promo_text, image_url')
                  .eq('client_id', clientId)
                  .eq('active', true);

                let inventoryContext = '';
                
                if (companyProducts && companyProducts.length > 0) {
                  const productLines = companyProducts.map(p => {
                    let line = `- ${p.name}: ${p.description || 'Sin descripción'}`;
                    if (p.price && p.price > 0) line += `. Precio: $${p.price}`;
                    if (p.promo_text) line += `. 🔥 PROMO: ${p.promo_text}`;
                    if (p.image_url) {
                        const urls = p.image_url.split(',');
                        if (urls.length > 1) {
                            line += `. URL de Foto del Producto: ${urls[0].trim()} | URL de Foto Instalado (Ambiente): ${urls[1].trim()}`;
                        } else {
                            line += `. URL de Foto del Producto: ${urls[0].trim()}`;
                        }
                    }
                    return line;
                  }).join('\n');

                  const promos = companyProducts.filter(p => p.promo_text);
                  const promoSection = promos.length > 0 
                    ? `\n\n📢 PROMOCIONES ACTIVAS:\n${promos.map(p => `- ${p.promo_text}`).join('\n')}`
                    : '';

                  inventoryContext = `\nPRODUCTOS DISPONIBLES DE ${clientSetup.name || 'LA EMPRESA'}:\n${productLines}${promoSection}\n\nREGLAS: Solo recomienda estos productos reales. Aplica las promociones activas si aplican. Responde de forma amable, profesional y persuasiva.
SI EL CLIENTE PIDE UNA FOTO DE UN PRODUCTO, ¡ESTÁ ESTRICTAMENTE PROHIBIDO USAR MARKDOWN (ej. [Nombre](URL))! 
DEBES enviar la imagen usando EXACTA Y ÚNICAMENTE esta etiqueta secreta: [SEND_IMAGE: URL].
MUY IMPORTANTE SOBRE CÓMO ENVIAR FOTOS: NUNCA uses listas numeradas (ej. "1. Foto del producto") ni viñetas. Háblale al cliente de forma MUY natural y humana, interrumpiendo tu texto con la etiqueta para que parezca que estás chateando.
Ejemplo EXACTO de cómo debes estructurar tu respuesta cuando envías varias fotos:
"¡Claro Cristian! Mira, este es el piso oscuro en formato listón que te comentaba:"
[SEND_IMAGE: URL_DEL_PRODUCTO]
"Y así es como se vería ya instalado en un espacio real, queda súper elegante y acogedor:"
[SEND_IMAGE: URL_AMBIENTE]
"¿Qué te parece? ¿Te gusta este estilo o prefieres que miremos opciones más claras?"

Si el producto tiene varias URLs, escoge 2 o máximo 3 para enviarle de forma natural.
SI EL CLIENTE PIDE HABLAR CON UN ASESOR, HUMANO O PERSONA, O SI NO SABES RESPONDER, INCLUYE EL TAG '[NEEDS_HUMAN]' AL FINAL DE TU MENSAJE.
SI EL CLIENTE CONFIRMA LA COMPRA DE UN PRODUCTO ESPECÍFICO, INCLUYE EL TAG '[SALE_CONFIRMED: Nombre del Producto]' AL FINAL.
ADEMÁS, EVALÚA LA INTENCIÓN DEL CLIENTE Y AÑADE ESTE TAG AL FINAL DE TU RESPUESTA:
[LEAD_STATE: Etapa | Score]
Donde Etapa es uno de: "Nuevo", "Contactado", "Interesado", "Negociación", "Venta Cerrada", "Venta Perdida".
Donde Score es un número del 1 al 100.
`;
                } else {
                  inventoryContext = '\n[No hay productos configurados en el catálogo. Responde de forma general y amable. SI PIDEN ASESOR INCLUYE EL TAG [NEEDS_HUMAN]]\n';
                }
                // ========== END DYNAMIC INVENTORY ==========

                // Support for Base64 Images injected by processMediaMessage
                const aiMessages = [
                    { role: 'system', content: `${clientSetup.prompt}\n\n[DATOS DEL CLIENTE ACTUAL: Nombre: ${senderName}]\n\n${inventoryContext}` },
                    ...finalMessages.slice(-10).map(m => {
                        let cleanContent = m.content || "";
                        if (m.role === 'user' && cleanContent) {
                            cleanContent = cleanContent.replace(/^\[Nota de Voz del Cliente\]:\s*/, '');
                        }
                        if (m.role === 'user' && cleanContent.includes('[IMAGEN_BASE64_URL]:')) {
                            const [textPart, base64Url] = cleanContent.split('[IMAGEN_BASE64_URL]:');
                            return {
                                role: 'user',
                                content: [
                                    { type: 'text', text: textPart || "El cliente envió esta imagen." },
                                    { type: 'image_url', image_url: { url: base64Url.trim() } }
                                ]
                            };
                        }
                        return { role: m.role === 'agent' ? 'assistant' : 'user', content: cleanContent };
                    })
                ];                const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${openRouterKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://chatbot-crm-xi.vercel.app/',
                        'X-Title': `NexusCRM - ${clientSetup.name || 'AI Agent'}`
                    },
                    body: JSON.stringify({
                        model: 'openai/gpt-4o',
                        messages: aiMessages,
                        max_tokens: 400
                    })
                });

                if (aiResponse.ok) {
                    const aiData = await aiResponse.json();
                    const botReplyText = aiData.choices?.[0]?.message?.content;
                    
                    if (botReplyText) {
                        // Analizar Tags
                        const needsHumanMatch = botReplyText.match(/\[NEEDS_HUMAN(?::(.*?))?\]/i);
                        const needsHuman = !!needsHumanMatch;
                        const humanDept = needsHumanMatch ? (needsHumanMatch[1] || '').trim().toUpperCase() : null;

                        const leadStateMatch = botReplyText.match(/\[LEAD_STATE:\s*(.*?)\s*\|\s*(\d+)\]/i);
        const saleMatch = botReplyText.match(/\[SALE_CONFIRMED:\s*(.*?)\]/i);
                        const citaMatch = botReplyText.match(/\[CITA_AGENDADA(?::\s*(.+?))?\]/i);

                                                // Message Interleaving Logic (Text -> Image -> Text)
                        const messageQueue = [];
                        const extractionRegex = /(\[SEND_IMAGE:\s*(https?:\/\/[^\]]+)\]|\[.*?\]\((https?:\/\/.*?supabase\.co\/storage.*?)\))/gi;
                        let lastIndex = 0;
                        let extractionMatch;

                        const cleanText = (text) => text.replace(/\[NEEDS_HUMAN(?:\s*:.*?)?\]/gi, '')
                                                        .replace(/\[SALE_CONFIRMED: .*?\]/gi, '')
                                                        .replace(/\[LEAD_STATE:.*?\]/gi, '')
                                                        .replace(/\[CITA_AGENDADA(?:\s*:.*?)?\]/gi, '')
                                                        .trim();

                        while ((extractionMatch = extractionRegex.exec(botReplyText)) !== null) {
                            let textBefore = botReplyText.slice(lastIndex, extractionMatch.index);
                            textBefore = cleanText(textBefore);
                            if (textBefore) {
                                messageQueue.push({ type: 'text', content: textBefore });
                            }

                            let url = (extractionMatch[2] || extractionMatch[3]).trim();
                            let finalImgUrl = url;
                            if (url.toLowerCase().endsWith('.webp')) {
                                finalImgUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}&output=jpg`;
                            }
                            messageQueue.push({ type: 'image', content: finalImgUrl });
                            lastIndex = extractionRegex.lastIndex;
                        }

                        let textAfter = botReplyText.slice(lastIndex);
                        textAfter = cleanText(textAfter);
                        if (textAfter) {
                            messageQueue.push({ type: 'text', content: textAfter });
                        }

                        // Actualizar Lead Pipeline
                        let stage = 'Contactado';
                        let score = 10;
                        if (leadStateMatch) {
                             stage = leadStateMatch[1].trim();
                             score = parseInt(leadStateMatch[2]);
                        }
                        if (saleMatch) {
                             stage = 'Venta Cerrada';
                             score = 100;
                        }

                        try {
                             const { data: existingLead } = await supabase.from('leads').select('id').eq('client_id', clientId).eq('phone', senderPhone).single();
                             if (existingLead) {
                                  await supabase.from('leads').update({ stage, score, name: senderName }).eq('id', existingLead.id);
                             } else {
                                  await supabase.from('leads').insert([{
                                       client_id: clientId,
                                       phone: senderPhone,
                                       name: senderName,
                                       stage,
                                       score,
                                       source: 'WhatsApp',
                                       value: '$0'
                                  }]);
                             }
                        } catch(e) { console.error('Lead error', e) }

                        // Asignación a Ventas o Departamentos Específicos
                        let assignedUserId = null;
                        if (humanDept === 'CREARTE') {
                             assignedUserId = '096b5cb3-9754-4581-be3c-d6c2a64caead'; // Crearte Admin UUID
                        } else if (humanDept === 'ASESOR') {
                             assignedUserId = '2db217bc-c72e-448a-9a8d-4b2469c93661'; // Asesor UUID
                        } else if (saleMatch) {
                             const { data: vends } = await supabase.from('team_members').select('user_id').eq('client_id', clientId).eq('role', 'vendedor').eq('status', 'activo').limit(1);
                             if (vends && vends.length > 0) assignedUserId = vends[0].user_id;
                        }

                        // Guardar en CRM
                        const cleanReplyForDB = cleanText(botReplyText).replace(/\[.*?\]\((https?:\/\/.*?supabase\.co\/storage.*?)\)/gi, '');
                        const { data: latest } = await supabase.from('conversations').select('messages').eq('id', conversationId).single();
                        let updatePayload = {
                            messages: [...(latest?.messages || []), { role: 'agent', content: cleanReplyForDB, timestamp: new Date().toISOString() }],
                            updated_at: new Date().toISOString(),
                            needs_human: needsHuman
                        };
                        if (assignedUserId) {
                             updatePayload.assigned_to = assignedUserId;
                        }

                        await supabase.from('conversations').update(updatePayload).eq('id', conversationId);

                        // Crear Notificación si necesita humano
                        if (needsHuman) {
                          let notifMsg = `Intervención requerida para ${senderName}`;
                          if (humanDept) notifMsg += ` (Área: ${humanDept})`;
                          await supabase.from('notifications').insert([{
                            client_id: clientId,
                            conversation_id: conversationId,
                            message: notifMsg,
                            type: 'escalation'
                          }]);
                        }
                        
                        // Notificación de Cita y Registro
                        if (citaMatch) {
                          const appointmentDateStr = citaMatch[1] ? citaMatch[1].trim() : null;
                          let msg = `Nueva cita agendada con ${senderName}`;
                          if (appointmentDateStr) msg += ` para el ${appointmentDateStr}`;

                          await supabase.from('notifications').insert([{
                            client_id: clientId,
                            conversation_id: conversationId,
                            message: msg,
                            type: 'appointment'
                          }]);

                          if (appointmentDateStr) {
                             try {
                               const parsedDate = new Date(appointmentDateStr);
                               if (!isNaN(parsedDate)) {
                                  await supabase.from('appointments').insert([{
                                     client_id: clientId,
                                     title: `Cita de Remodelación/Asesoría`,
                                     date: parsedDate.toISOString().split('T')[0],
                                     time: parsedDate.toISOString().split('T')[1].slice(0,5),
                                     contact_name: senderName,
                                     contact_phone: senderPhone,
                                     department: humanDept === 'CREARTE' ? 'Crearte' : 'Trazzos',
                                     status: 'Confirmed'
                                  }]);
                                }
                             } catch(err) {
                               console.error("Error parsing appointment date", err);
                             }
                          }
                        }

                        // Descontar Stock si hay venta y Notificar
                        if (saleMatch && saleMatch[1]) {
                          const productName = saleMatch[1].trim();
                          
                          await supabase.from('notifications').insert([{
                            client_id: clientId,
                            conversation_id: conversationId,
                            message: `Venta cerrada: ${productName} a ${senderName}`,
                            type: 'sale'
                          }]);

                          const { data: prod } = await supabase
                            .from('products')
                            .select('id, stock')
                            .eq('client_id', clientId)
                            .ilike('name', `%${productName}%`)
                            .limit(1)
                            .single();
                          
                          if (prod && prod.stock > 0) {
                            await supabase.from('products').update({ stock: prod.stock - 1 }).eq('id', prod.id);
                          }
                        }

                        // Enviar a WhatsApp
                        const WHATSAPP_TOKEN = clientSetup.whatsapp_token || process.env.WHATSAPP_TOKEN;
                        const PHONE_NUMBER_ID = clientSetup.phone_number_id || process.env.PHONE_NUMBER_ID;

                        if (WHATSAPP_TOKEN && PHONE_NUMBER_ID) {
                            for (const msg of messageQueue) {
                                if (msg.type === 'text') {
                                    await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
                                      method: 'POST',
                                      headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        messaging_product: 'whatsapp',
                                        to: senderPhone,
                                        type: 'text',
                                        text: { body: msg.content }
                                      })
                                    }).then(async r => {
                                        if (!r.ok) {
                                            const errData = await r.json();
                                            console.error('[WHATSAPP TEXT ERROR]', errData);
                                        }
                                    });
                                } else if (msg.type === 'image') {
                                    await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
                                      method: 'POST',
                                      headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        messaging_product: 'whatsapp',
                                        to: senderPhone,
                                        type: 'image',
                                        image: { link: msg.content }
                                      })
                                    }).then(async imgRes => {
                                      if (!imgRes.ok) {
                                          const imgErr = await imgRes.json();
                                          console.error('[WHATSAPP IMAGE ERROR]', imgErr);
                                          await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
                                              method: 'POST',
                                              headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                messaging_product: 'whatsapp',
                                                to: senderPhone,
                                                type: 'text',
                                                text: { body: "*(Error de sistema: No se pudo cargar la imagen)*" }
                                              })
                                          });
                                      }
                                    }).catch(e => console.error("Image send error", e));
                                }
                                // Ensure strict sequential delivery
                                await new Promise(r => setTimeout(r, 600));
                            }
                        }
                    }
                } else {
                    const err = await aiResponse.text();
                    await logErrorToCRM(`Error IA: ${err}`);
                }
            } catch (aiErr) {
                console.error('[AI DISPATCH ERROR]', aiErr);
                await logErrorToCRM(`Error de IA: ${aiErr.message}`);
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
