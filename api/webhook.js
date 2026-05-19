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
        const tempClient = await supabase.from('clients').select('whatsapp_token').eq('phone_number_id', phoneNumberId).single();
        const whatsappToken = tempClient?.data?.whatsapp_token;
        if (whatsappToken) {
           textResponse = await processMediaMessage(messageObj, whatsappToken, process.env.OPENAI_API_KEY);
        } else {
           textResponse = '[Multimedia: No se pudo obtener token para descargar]';
        }
      } else if (!textResponse) {
        textResponse = '[Multimedia/No Text]';
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
      const { data: clients } = await supabase
        .from('clients')
        .select('id, user_id, active, prompt, model, whatsapp_token, name, phone_number_id')
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

      // 3. AI Dispatch — DYNAMIC per-company (no more hardcoded Naturel products)
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
                // Read products from the products table for THIS specific company
                const { data: companyProducts } = await supabase
                  .from('products')
                  .select('name, description, price, category, promo_text')
                  .eq('client_id', clientId)
                  .eq('active', true);

                let inventoryContext = '';
                
                if (companyProducts && companyProducts.length > 0) {
                  const productLines = companyProducts.map(p => {
                    let line = `- ${p.name}: ${p.description || 'Sin descripción'}`;
                    if (p.price && p.price > 0) line += `. Precio: $${p.price}`;
                    if (p.promo_text) line += `. 🔥 PROMO: ${p.promo_text}`;
                    return line;
                  }).join('\n');

                  const promos = companyProducts.filter(p => p.promo_text);
                  const promoSection = promos.length > 0 
                    ? `\n\n📢 PROMOCIONES ACTIVAS:\n${promos.map(p => `- ${p.promo_text}`).join('\n')}`
                    : '';

                  inventoryContext = `\nPRODUCTOS DISPONIBLES DE ${clientSetup.name || 'LA EMPRESA'}:\n${productLines}${promoSection}\n\nREGLAS: Solo recomienda estos productos reales. Aplica las promociones activas si aplican. Responde de forma amable, profesional y persuasiva.
SI EL CLIENTE PIDE HABLAR CON UN ASESOR, HUMANO O PERSONA, O SI NO SABES RESPONDER, INCLUYE EL TAG '[NEEDS_HUMAN]' AL FINAL DE TU MENSAJE.
SI EL CLIENTE CONFIRMA LA COMPRA DE UN PRODUCTO ESPECÍFICO, INCLUYE EL TAG '[SALE_CONFIRMED: Nombre del Producto]' AL FINAL.\n`;
                } else {
                  inventoryContext = '\n[No hay productos configurados en el catálogo. Responde de forma general y amable. SI PIDEN ASESOR INCLUYE EL TAG [NEEDS_HUMAN]]\n';
                }
                // ========== END DYNAMIC INVENTORY ==========

                // Support for Base64 Images injected by processMediaMessage
                const aiMessages = [
                    { role: 'system', content: `${clientSetup.prompt}\n\n[DATOS DEL CLIENTE ACTUAL: Nombre: ${senderName}]\n\n${inventoryContext}` },
                    ...finalMessages.slice(-10).map(m => {
                        if (m.role === 'user' && m.content.includes('[IMAGEN_BASE64_URL]:')) {
                            const [textPart, base64Url] = m.content.split('[IMAGEN_BASE64_URL]:');
                            return {
                                role: 'user',
                                content: [
                                    { type: 'text', text: "El cliente envió esta imagen." },
                                    { type: 'image_url', image_url: { url: base64Url.trim() } }
                                ]
                            };
                        }
                        return { role: m.role === 'agent' ? 'assistant' : 'user', content: m.content };
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
                        const needsHuman = botReplyText.includes('[NEEDS_HUMAN]');
                        const saleMatch = botReplyText.match(/\[SALE_CONFIRMED: (.*?)\]/);
                        
                        let cleanReply = botReplyText.replace('[NEEDS_HUMAN]', '').replace(/\[SALE_CONFIRMED: .*?\]/, '').trim();

                        // Guardar en CRM
                        const { data: latest } = await supabase.from('conversations').select('messages').eq('id', conversationId).single();
                        await supabase.from('conversations').update({
                            messages: [...(latest?.messages || []), { role: 'agent', content: cleanReply, timestamp: new Date().toISOString() }],
                            updated_at: new Date().toISOString(),
                            needs_human: needsHuman
                        }).eq('id', conversationId);

                        // Crear Notificación si necesita humano
                        if (needsHuman) {
                          await supabase.from('notifications').insert([{
                            client_id: clientId,
                            conversation_id: conversationId,
                            message: `Intervención requerida para ${senderName}`,
                            type: 'escalation'
                          }]);
                        }

                        // Descontar Stock si hay venta
                        if (saleMatch && saleMatch[1]) {
                          const productName = saleMatch[1].trim();
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
                            await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({
                                messaging_product: 'whatsapp',
                                to: senderPhone,
                                type: 'text',
                                text: { body: cleanReply }
                              })
                            }).then(async r => {
                                if (!r.ok) {
                                    const errData = await r.json();
                                    console.error('[WHATSAPP SEND ERROR]', errData);
                                    const { data: latest } = await supabase.from('conversations').select('messages').eq('id', conversationId).single();
                                    await supabase.from('conversations').update({
                                        messages: [...(latest?.messages || []), { role: 'agent', content: `[ERROR META]: ${errData.error?.message || 'Error desconocido'}`, timestamp: new Date().toISOString() }]
                                    }).eq('id', conversationId);
                                }
                            });
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
