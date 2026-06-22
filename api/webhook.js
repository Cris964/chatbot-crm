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

      let clientQuery = supabase.from('clients').select('id, user_id, active, prompt, model, whatsapp_token, name, phone_number_id, facebook_page_id, instagram_account_id, facebook_access_token');
      if (channel === 'whatsapp') clientQuery = clientQuery.eq('phone_number_id', recipientId);
      if (channel === 'messenger') clientQuery = clientQuery.eq('facebook_page_id', recipientId);
      if (channel === 'instagram') clientQuery = clientQuery.eq('instagram_account_id', recipientId);
      
      const { data: clients, error: clientErr } = await clientQuery.limit(1);

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
      const isNeedsHuman = existingChats?.[0]?.needs_human === true;
      if (clients?.[0]?.active !== false && conversationId && !isNeedsHuman) {
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
                let { data: companyProducts } = await supabase
                  .from('products')
                  .select('name, description, price, category, promo_text, image_url')
                  .eq('client_id', clientId)
                  .eq('active', true)
                  .limit(1000);

                if (companyProducts && companyProducts.length > 50) {
                    const recentUserMsgs = finalMessages.filter(m => m.role === 'user').slice(-2).map(m => (m.content || '').toLowerCase()).join(' ');
                    const stopWords = ['para', 'como', 'este', 'esta', 'pero', 'quiero', 'necesito', 'busco', 'tienen', 'tiene', 'del', 'las', 'los', 'que', 'por', 'con', 'sin', 'una', 'uno', 'mas', 'muy', 'son'];
                    let keywords = recentUserMsgs.split(/[^a-záéíóúñ]+/).filter(w => w.length >= 3 && !stopWords.includes(w));
                    
                    const synonyms = { 
                        'plateada': ['cromada', 'satinada', 'cromo'], 
                        'plateado': ['cromado', 'satinado', 'cromo'],
                        'dorada': ['oro', 'gold', 'dorado', 'dorada'],
                        'dorado': ['oro', 'gold', 'dorado', 'dorada'],
                        'pared': ['paredes', 'muro', 'muros', 'revestimiento', 'enchape', 'fachada', 'baño'],
                        'piso': ['pisos', 'suelo', 'ceramica', 'porcelanato', 'interior', 'exterior'],
                        'ceramica': ['cerámica', 'ceramicas', 'cerámicas'],
                        'madera': ['maderas', 'listón', 'liston', 'maderato']
                    };
                    let expandedKeywords = [...keywords];
                    keywords.forEach(k => { if (synonyms[k]) expandedKeywords.push(...synonyms[k]); });

                    if (expandedKeywords.length > 0) {
                        const scoredProducts = companyProducts.map(p => {
                            let score = 0;
                            const targetStr = ((p.name || '') + " " + (p.category || '') + " " + (p.description || '')).toLowerCase();
                            expandedKeywords.forEach(k => { if (targetStr.includes(k)) score++; });
                            
                            // Penalizar "oro rosa" si el usuario no pidió explícitamente "rosa"
                            if ((targetStr.includes('oro rosa') || targetStr.includes('rose gold')) && !expandedKeywords.includes('rosa') && !expandedKeywords.includes('rose')) {
                                score -= 5;
                            }
                            
                            // Exclusiones mutuas estrictas (evitar confundir lavamanos con lavaplatos y pisos con paredes)
                            if (targetStr.includes('lavaplatos') && !expandedKeywords.includes('lavaplatos') && expandedKeywords.includes('lavamanos')) {
                                score -= 10;
                            }
                            if (targetStr.includes('lavamanos') && !expandedKeywords.includes('lavamanos') && expandedKeywords.includes('lavaplatos')) {
                                score -= 10;
                            }
                            if (targetStr.match(/\bpisos?\b/) && !expandedKeywords.includes('piso') && !expandedKeywords.includes('pisos') && (expandedKeywords.includes('pared') || expandedKeywords.includes('paredes'))) {
                                score -= 10;
                            }
                            if (targetStr.match(/\bpared(es)?\b/) && !expandedKeywords.includes('pared') && !expandedKeywords.includes('paredes') && (expandedKeywords.includes('piso') || expandedKeywords.includes('pisos'))) {
                                score -= 10;
                            }
                            
                            // Penalizar fuertemente accesorios si buscan pisos/paredes
                            const buscaRevestimiento = expandedKeywords.some(k => ['piso', 'pisos', 'pared', 'paredes', 'porcelanato', 'ceramica', 'cerámica', 'madera'].includes(k));
                            const esAccesorio = targetStr.includes('accesorio') || targetStr.includes('griferia') || targetStr.includes('ducha') || targetStr.includes('sanitario');
                            if (esAccesorio && buscaRevestimiento && !expandedKeywords.includes('accesorio') && !expandedKeywords.includes('griferia')) {
                                score -= 20;
                            }
                            
                            // Penalizar pisos/paredes si buscan accesorios
                            const buscaAccesorio = expandedKeywords.some(k => ['griferia', 'ducha', 'accesorio', 'sanitario'].includes(k));
                            const esRevestimiento = targetStr.match(/\b(piso|pisos|pared|paredes|porcelanato|ceramica|cerámica|madera)\b/);
                            if (esRevestimiento && buscaAccesorio && !buscaRevestimiento) {
                                score -= 20;
                            }

                            // Exclusiones de Categoría Estricta (Cerámica vs Porcelanato vs Madera)
                            const pidePorcelanato = expandedKeywords.includes('porcelanato');
                            const pideCeramica = expandedKeywords.includes('ceramica') || expandedKeywords.includes('cerámica');
                            const pideMadera = expandedKeywords.includes('madera');
                            
                            const esPorcelanato = targetStr.includes('porcelanato');
                            const esCeramica = targetStr.includes('ceramica') || targetStr.includes('cerámica');
                            const esMadera = targetStr.includes('madera') || targetStr.includes('listón');

                            if (pidePorcelanato && esCeramica && !esPorcelanato) score -= 15;
                            if (pideCeramica && esPorcelanato && !esCeramica) score -= 15;
                            
                            if (pideMadera && !esMadera && (esCeramica || esPorcelanato)) score -= 10;
                            if (!pideMadera && esMadera) score -= 5;
                            
                            // Boost extra por match exacto de categoría
                            if (pidePorcelanato && esPorcelanato) score += 5;
                            if (pideCeramica && esCeramica) score += 5;
                            if (pideMadera && esMadera) score += 10;
                            
                            return { ...p, score };
                        });
                        scoredProducts.sort((a, b) => b.score - a.score);
                        companyProducts = scoredProducts.filter(p => p.score > 0).slice(0, 8);
                        // Se eliminó el fallback de cargar 15 productos al azar si no hay coincidencias.
                        // Es mejor que la IA sepa que no hay coincidencias y haga más preguntas indagatorias.
                    } else {
                        // Si el usuario no usó ninguna palabra clave relevante, 
                        // tampoco enviamos productos al azar.
                        companyProducts = [];
                    }
                }

                let inventoryContext = '';
                
                if (companyProducts && companyProducts.length > 0) {
                  const productLines = companyProducts.map(p => {
                    let line = `---
PRODUCTO: ${p.name}
DESCRIPCIÓN: ${p.description || 'Sin descripción'}
PRECIO: ${p.price > 0 ? '$' + p.price : 'Consultar'}`;
                    if (p.promo_text) line += `\nPROMOCIÓN: ${p.promo_text}`;
                    if (p.image_url) {
                        const urls = p.image_url.split(',').map(u => u.trim()).filter(Boolean);
                        line += `\nFOTOS DEL PRODUCTO:\n` + urls.map((u, i) => `Foto ${i+1}: ${u}`).join('\n');
                    }
                    line += `\n---`;
                    return line;
                  }).join('\n\n');

                  const promos = companyProducts.filter(p => p.promo_text);
                  const promoSection = promos.length > 0 
                    ? `\n\n📢 PROMOCIONES ACTIVAS:\n${promos.map(p => `- ${p.promo_text}`).join('\n')}`
                    : '';

                  inventoryContext = `\nPRODUCTOS DISPONIBLES DE ${clientSetup.name || 'LA EMPRESA'}:\n${productLines}${promoSection}\n\nREGLAS: Solo recomienda estos productos reales. Aplica las promociones activas si aplican. Responde de forma amable, profesional y persuasiva.
REGLAS DE FOTOS (MUY IMPORTANTE):
1. SOLO puedes usar URLs que estén listadas en el catálogo de arriba, del MISMO PRODUCTO que estás mostrando. JAMÁS mezcles URLs de productos distintos.
2. Si el producto tiene "Foto 1" Y "Foto 2", DEBES enviar AMBAS. Como no sabes cuál es la foto del producto y cuál es la del ambiente instalado, preséntalas juntas.
3. Usa EXACTAMENTE esta etiqueta para cada imagen, poniendo la URL REAL (que empieza con https://) de la foto que está en el catálogo: [SEND_IMAGE: https://...]
4. ❌ PROHIBIDO escribir títulos antes de la imagen como: *Foto del Producto*: | 1. Foto del producto: | Aquí la imagen:
5. ✅ CORRECTO - Frases naturales terminadas en dos puntos (:), presentando ambas fotos a la vez:
"Mira, aquí tienes las fotos de este producto, tanto en detalle como ya instalado en ambiente:"
[SEND_IMAGE: https://url_real_de_la_foto_1.jpg]
[SEND_IMAGE: https://url_real_de_la_foto_2.jpg]
"¿Qué te parece ese estilo?"
6. Si el producto solo tiene una foto, manda solo esa con una frase natural.
SI EL CLIENTE PIDE HABLAR CON UN ASESOR O HUMANO, INCLUYE '[NEEDS_HUMAN]' AL FINAL.
REGLA SOBRE ASESORES: NUNCA uses la frase "asesor humano". Si vas a transferir el chat o alguien pide ayuda de un asesor, di EXACTAMENTE: "Te voy a dejar con un asesor para cotizar el envío." y nada más.
EVALÚA LA INTENCIÓN Y AÑADE AL FINAL: [LEAD_STATE: Etapa | Score]
Etapa: "Nuevo", "Contactado", "Interesado", "Negociación", "Venta Cerrada", "Venta Perdida". Score: 1-100.
`;
                } else {
                  inventoryContext = '\n[INVENTARIO OCULTO/VACÍO]: No se encontraron productos que coincidan con la descripción del cliente en esta búsqueda. OBLIGATORIO: Hazle más preguntas para indagar exactamente qué busca (material, uso interior/exterior, formato, colores). NO ofrezcas productos ni fotos, porque no tienes el catálogo a la mano ahora mismo. SI PIDEN ASESOR INCLUYE EL TAG [NEEDS_HUMAN:ASESOR]\n';
                }
                // ========== END DYNAMIC INVENTORY ==========

                // Support for Base64 Images injected by processMediaMessage
                const aiMessages = [
                    { role: 'system', content: `${clientSetup.prompt}\n\n[DATOS DEL CLIENTE ACTUAL: Nombre: ${senderName}]\n\n${inventoryContext}` },
                    ...finalMessages.slice(-30).map(m => {
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
                        
                        // Extraer Nombre del Cliente
                        const nameMatch = botReplyText.match(/\[CLIENT_NAME:\s*(.+?)\]/i);
                        let clientNameExtracted = nameMatch ? nameMatch[1].trim() : null;

                                                // Message Interleaving Logic (Text -> Media -> Text)
                        const messageQueue = [];
                        const extractionRegex = /(\[(SEND_IMAGE|SEND_VIDEO):\s*(https?:\/\/[^\]]+)\]|\[.*?\]\((https?:\/\/.*?supabase\.co\/storage.*?)\)|(https?:\/\/.*?supabase\.co\/storage\S+))/gi;
                        let lastIndex = 0;
                        let extractionMatch;

                        const forbiddenNames = ['San Francisco', 'Macao', 'Torrejon', 'Tahoe', 'Bali', 'Java', 'Marruecos', 'Jade', 'Magna', 'Orvix', 'Zyra', 'Aluvia', 'Manantial', 'Laguna', 'Montecarlo', 'Temesi', 'Giorno', 'Burgos', 'Cima', 'Fratelo', 'Granada', 'Nyren', 'Sevilla', 'Tirso', 'Adriatico', 'Azurita', 'Barat', 'Cianita', 'Cocora', 'Dakar', 'Foresta', 'Iseo', 'Indonesia', 'Casablanca', 'Baru', 'Gili', 'Nebriza', 'Ocrea'];

                        const cleanText = (text) => {
                            let t = text;
                            t = t.replace(/\[NEEDS_HUMAN(?:\s*:.*?)?\]/gi, '');
                            t = t.replace(/\[SALE_CONFIRMED:.*?\]/gi, '');
                            t = t.replace(/\[LEAD_STATE:.*?\]/gi, '');
                            t = t.replace(/\[CITA_AGENDADA(?:\s*:.*?)?\]/gi, '');
                            t = t.replace(/\[TRANSFERIR_ASESOR\]/gi, '');
                            // Strip AI-generated image labels like *Foto del Producto*: or *Ejemplo de Instalación*:
                            // This matches *anything*: on its own line OR inline, globally
                            t = t.replace(/\*[^\n*]{1,80}\*\s*:\s*/g, '');
                            // Strip numbered labels like: 1. Foto del Producto:
                            t = t.replace(/^\s*\d+\.\s*[^\n]{1,80}:\s*$/gim, '');
                            
                            // Agresivo filtro de nombres comerciales
                            for (const name of forbiddenNames) {
                                const regex = new RegExp('\\b' + name + '\\b', 'gi');
                                t = t.replace(regex, 'este modelo');
                            }
                            
                            // Clean up extra blank lines
                            t = t.replace(/\n{3,}/g, '\n\n');
                            return t.trim();
                        };

                        while ((extractionMatch = extractionRegex.exec(botReplyText)) !== null) {
                            let textBefore = botReplyText.slice(lastIndex, extractionMatch.index);
                            textBefore = cleanText(textBefore);
                            if (textBefore) {
                                const paragraphs = textBefore.split(/\n{1,}/);
                                for (const p of paragraphs) {
                                    if (p.trim()) messageQueue.push({ type: 'text', content: p.trim() });
                                }
                            }

                            let url = (extractionMatch[3] || extractionMatch[4] || extractionMatch[5]).trim();
                            // Clean trailing punctuation if it caught a raw URL
                            url = url.replace(/[\)\]\.,]+$/, '');
                            
                            let isVideo = extractionMatch[2] === 'SEND_VIDEO' || url.toLowerCase().endsWith('.mp4');
                            let msgType = isVideo ? 'video' : 'image';
                            
                            let finalMediaUrl = url;
                            if (msgType === 'image' && url.toLowerCase().endsWith('.webp')) {
                                finalMediaUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}&output=jpg`;
                            }
                            messageQueue.push({ type: msgType, content: finalMediaUrl });
                            lastIndex = extractionRegex.lastIndex;
                        }

                        let textAfter = botReplyText.slice(lastIndex);
                        textAfter = cleanText(textAfter);
                        if (textAfter) {
                            const paragraphs = textAfter.split(/\n{1,}/);
                            for (const p of paragraphs) {
                                if (p.trim()) messageQueue.push({ type: 'text', content: p.trim() });
                            }
                        }

                        // Reorder queue: intro text → all media → closing text
                        if (messageQueue.filter(m => m.type !== 'text').length >= 2) {
                            const introTexts = [];
                            const media = [];
                            const closingTexts = [];
                            let foundMedia = false;
                            for (const item of messageQueue) {
                                if (item.type !== 'text') {
                                    media.push(item);
                                    foundMedia = true;
                                } else if (!foundMedia) {
                                    introTexts.push(item);
                                } else {
                                    closingTexts.push(item);
                                }
                            }
                            messageQueue.length = 0;
                            messageQueue.push(...introTexts, ...media, ...closingTexts);
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

                        // Actualizar nombre si la IA lo descubrió
                        let finalSenderName = senderName;
                        if (clientNameExtracted && clientNameExtracted.toLowerCase() !== 'cliente') {
                             finalSenderName = clientNameExtracted;
                             // Opcional: Actualizar 'user_name' en la tabla conversations de una vez
                             await supabase.from('conversations').update({ user_name: finalSenderName }).eq('id', conversationId);
                             console.log(`[NAME EXTRACTED] Updated conversation ${conversationId} user_name to ${finalSenderName}`);
                        }

                        try {
                             const { data: existingLead } = await supabase.from('leads').select('id').eq('client_id', clientId).eq('phone', senderPhone).single();
                             if (existingLead) {
                                  await supabase.from('leads').update({ stage, score, name: finalSenderName }).eq('id', existingLead.id);
                             } else {
                                  await supabase.from('leads').insert([{
                                       client_id: clientId,
                                       phone: senderPhone,
                                       name: finalSenderName,
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
                        const cleanReplyForDB = cleanText(botReplyText)
                            .replace(/\[.*?\]\((https?:\/\/.*?supabase\.co\/storage.*?)\)/gi, '')
                            .replace(/\[CLIENT_NAME:.*?\]/i, '');
                        const { data: latest } = await supabase.from('conversations').select('messages').eq('id', conversationId).single();
                        let updatePayload = {
                            messages: [...(latest?.messages || []), { role: 'agent', content: cleanReplyForDB, timestamp: new Date().toISOString() }],
                            updated_at: new Date().toISOString(),
                            needs_human: needsHuman
                        };
                        if (assignedUserId) {
                             updatePayload.assigned_to = assignedUserId;
                        }
                        if (humanDept) {
                             updatePayload.department = humanDept;
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

                        // Enviar a WhatsApp / Messenger / Instagram
                        const WHATSAPP_TOKEN = clientSetup.whatsapp_token || process.env.WHATSAPP_TOKEN;
                        const PHONE_NUMBER_ID = clientSetup.phone_number_id || process.env.PHONE_NUMBER_ID;
                        const FB_TOKEN = clientSetup.facebook_access_token;

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
                                    }).catch(e => console.error("Media send error", e));
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
                                }).catch(e => console.error("FB Media send error", e));
                            }
                            
                            // Ensure strict sequential delivery
                            await new Promise(r => setTimeout(r, 600));
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

    } catch (error) {
      console.error('[FATAL WEBHOOK ERROR]', error);
      return res.status(500).json({ error: 'Internal logic fail', details: error.message, stack: error.stack });
    }
  }

  return res.status(405).send('Method Not Allowed');
}
