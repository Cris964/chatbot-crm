import fetch from 'node-fetch';

export async function dispatchToAI({
  supabase,
  clientId,
  clientSetup,
  openRouterKey,
  conversationId,
  finalMessages,
  senderName,
  senderPhone,
  channel // 'whatsapp', 'messenger', 'instagram', or 'web'
}) {
  let { data: companyProducts } = await supabase
    .from('products')
    .select('name, description, price, category, promo_text, image_url')
    .eq('client_id', clientId)
    .eq('active', true)
    .limit(1000);

  if (companyProducts && companyProducts.length > 50) {
      const recentUserMsgs = finalMessages.filter(m => m.role === 'user').slice(-5).map(m => (m.content || '').toLowerCase()).join(' ');
      const sanitizedMsgs = recentUserMsgs.replace(/(\d+)\s*[*xX]\s*(\d+)/g, '$1x$2'); // Convert 60*120 or 60 X 120 to 60x120
      const stopWords = ['para', 'como', 'este', 'esta', 'pero', 'quiero', 'necesito', 'busco', 'tienen', 'tiene', 'del', 'las', 'los', 'que', 'por', 'con', 'sin', 'una', 'uno', 'mas', 'muy', 'son', 'color'];
      let keywords = sanitizedMsgs.split(/[^a-záéíóúñ0-9x]+/).filter(w => w.length >= 2 && !stopWords.includes(w));
      
      const synonyms = { 
          'plateada': ['cromada', 'satinada', 'cromo'], 
          'plateado': ['cromado', 'satinado', 'cromo'],
          'dorada': ['oro', 'gold', 'dorado', 'dorada'],
          'dorado': ['oro', 'gold', 'dorado', 'dorada'],
          'pared': ['paredes', 'muro', 'muros', 'revestimiento', 'enchape', 'fachada', 'baño'],
          'piso': ['pisos', 'suelo', 'ceramica', 'porcelanato', 'interior', 'exterior'],
          'ceramica': ['cerámica', 'ceramicas', 'cerámicas'],
          'madera': ['maderas', 'listón', 'liston', 'maderato'],
          'oscuro': ['plomo', 'wengué', 'avellana', 'grafito', 'negro', 'gris', 'oscuros'],
          'oscura': ['plomo', 'wengué', 'avellana', 'grafito', 'negro', 'gris', 'oscuras'],
          'grande': ['50x100', '58x118', '60x120', 'grandes'],
          'griferia': ['grifería', 'lavamanos', 'lavaplatos', 'monocontrol', 'vessel', 'placa', 'alta', 'baja', 'griferias', 'grifo'],
          'sanitario': ['sanitarios', 'inodoro', 'wc', 'poceta'],
          'accesorio': ['accesorios', 'rejilla', 'rejillas', 'jabonera', 'papelera'],
          'rejilla': ['rejillas', 'accesorio', 'accesorios'],
          'fachada': ['fachaleta', 'fachaletas', 'piedra', 'muro', 'fachadas'],
          'mueble': ['muebles', 'gabinete', 'combo', 'lavamanos'],
          'maletin': ['morral', 'morrales', 'maleta', 'maletas', 'mochila', 'bolso'],
          'maletín': ['morral', 'morrales', 'maleta', 'maletas', 'mochila', 'bolso'],
          'maleta': ['morral', 'morrales', 'maletín', 'maletin', 'bolso'],
          'mochila': ['morral', 'morrales', 'maleta', 'maletas', 'maletín']
      };
      let expandedKeywords = [...keywords];
      keywords.forEach(k => { if (synonyms[k]) expandedKeywords.push(...synonyms[k]); });

      if (expandedKeywords.length > 0) {
          const scoredProducts = companyProducts.map(p => {
              let score = 0;
              const targetStr = ((p.name || '') + " " + (p.category || '') + " " + (p.description || '')).toLowerCase();
              expandedKeywords.forEach(k => { if (targetStr.includes(k)) score++; });
              
              if ((targetStr.includes('oro rosa') || targetStr.includes('rose gold')) && !expandedKeywords.includes('rosa') && !expandedKeywords.includes('rose')) {
                  score -= 5;
              }
              if (targetStr.includes('lavaplatos') && !expandedKeywords.includes('lavaplatos') && expandedKeywords.includes('lavamanos')) score -= 10;
              if (targetStr.includes('lavamanos') && !expandedKeywords.includes('lavamanos') && expandedKeywords.includes('lavaplatos')) score -= 10;
              if (targetStr.match(/\bpisos?\b/) && !expandedKeywords.includes('piso') && !expandedKeywords.includes('pisos') && (expandedKeywords.includes('pared') || expandedKeywords.includes('paredes'))) score -= 10;
              if (targetStr.match(/\bpared(es)?\b/) && !expandedKeywords.includes('pared') && !expandedKeywords.includes('paredes') && (expandedKeywords.includes('piso') || expandedKeywords.includes('pisos'))) score -= 10;
              
              const buscaRevestimiento = expandedKeywords.some(k => ['piso', 'pisos', 'pared', 'paredes', 'porcelanato', 'ceramica', 'cerámica', 'madera'].includes(k));
              const esAccesorio = targetStr.match(/\b(accesorio|accesorios|griferia|ducha|sanitario|lavamanos|lavaplatos|mueble|espejo|corona|rejilla|rejillas)\b/i);
              if (esAccesorio && buscaRevestimiento && !expandedKeywords.some(k => ['accesorio', 'griferia', 'lavamanos', 'sanitario', 'rejilla', 'rejillas'].includes(k))) score -= 50;
              
              const buscaAccesorio = expandedKeywords.some(k => ['griferia', 'ducha', 'accesorio', 'sanitario', 'rejilla', 'rejillas'].includes(k));
              const esRevestimiento = targetStr.match(/\b(piso|pisos|pared|paredes|porcelanato|ceramica|cerámica|madera)\b/);
              if (esRevestimiento && buscaAccesorio && !buscaRevestimiento) score -= 20;

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
              if (pidePorcelanato && esPorcelanato) score += 5;
              if (pideCeramica && esCeramica) score += 5;
              if (pideMadera && esMadera) score += 10;
              
              if (false) score += 1000;

              return { ...p, score };
          });
          scoredProducts.sort((a, b) => b.score - a.score);
          companyProducts = scoredProducts.filter(p => p.score > 0).slice(0, 15);
      } else {
          companyProducts = companyProducts.filter(p => false);
      }
  }

  let inventoryContext = '';
  
  if (companyProducts && companyProducts.length > 0) {
    const productLines = companyProducts.map((p, index) => {
      let line = `---
OPCIÓN ${index + 1}:
CARACTERÍSTICAS: ${p.name}. ${p.description || 'Sin descripción'}
PRECIO: ${p.price > 0 ? '$' + p.price : 'Consultar'}`;
      if (p.promo_text) line += `\nPROMOCIÓN: ${p.promo_text}`;
      const isActivo = clientSetup.name && clientSetup.name.toLowerCase().includes('activo');
      if (p.image_url && (!isActivo || false)) {
          const urls = p.image_url.split(',').map(u => u.trim()).filter(Boolean);
          line += `\nFOTOS DEL PRODUCTO (COPIA Y PEGA ESTAS ETIQUETAS EXACTAS PARA MOSTRARLAS AL CLIENTE):\n` + urls.map(u => `[SEND_IMAGE: ${u}]`).join('\n');
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
1. COPIA Y PEGA las etiquetas [SEND_IMAGE: https://...] exactamente como aparecen en el catálogo de arriba del producto correspondiente.
2. Si el producto tiene varias etiquetas de fotos, DEBES enviarlas TODAS juntas, pegando una debajo de la otra.
3. ¡NUNCA inventes URLs! ¡NUNCA uses "example.com"! Usa ÚNICAMENTE las etiquetas proporcionadas en las opciones de arriba.
4. ❌ PROHIBIDO escribir títulos, nombres técnicos, referencias o viñetas antes de la imagen. (Ejemplo incorrecto: *Porcelanato Capri*: | 1. Foto del producto:).
5. ✅ CORRECTO - Solo usa frases conversacionales, cortas y súper naturales terminadas en dos puntos (:):
"Mira, aquí te paso unas fotos para que lo veas mejor:"
[SEND_IMAGE: https://url_real_de_supabase_aqui.jpg]
"¿Qué te parece ese estilo?"
SI EL CLIENTE PIDE HABLAR CON UN ASESOR O HUMANO, INCLUYE '[NEEDS_HUMAN]' AL FINAL.
REGLA SOBRE ASESORES: NUNCA uses la frase "asesor humano". Si vas a transferir el chat o alguien pide ayuda de un asesor, di EXACTAMENTE: "Para finalizar con tu orden, el área encargada ya se pondrá en contacto contigo, ¡muchas gracias!" y nada más.
INSTRUCCIÓN FINAL CRÍTICA (OBLIGATORIA): SIEMPRE, AL FINAL DE TU MENSAJE, DEBES INCLUIR LA ETIQUETA EXACTA: [LEAD_STATE: Etapa | Score]
(Ejemplo: [LEAD_STATE: Negociación | 50]. Usa las etapas definidas en tu prompt principal).
`;
  } else {
    let fallbackText = "OBLIGATORIO: Hazle más preguntas para indagar exactamente qué busca (modelo, tamaño, colores o estilo).";
    if (clientSetup.name && (clientSetup.name.includes("Trazzos") || clientSetup.name.includes("Samaritana") || clientSetup.name.includes("Trearq"))) {
        fallbackText = "OBLIGATORIO: Hazle más preguntas para indagar exactamente qué busca (material, uso interior/exterior, formato, colores).";
    }
    inventoryContext = `\n[INVENTARIO OCULTO/VACÍO]: No se encontraron productos que coincidan con la descripción del cliente en esta búsqueda. ${fallbackText} NO ofrezcas productos ni fotos, porque no tienes el catálogo a la mano ahora mismo. SI PIDEN ASESOR INCLUYE EL TAG [NEEDS_HUMAN]\nINSTRUCCIÓN FINAL CRÍTICA: SIEMPRE TERMINA TU MENSAJE CON [LEAD_STATE: Etapa | Score]\n`;
  }

  
  // Check if the user is responding to a broadcast (DIFUSION)
  let isRespondingToDifusion = false;
  if (finalMessages.length >= 2) {
      const lastUserMsg = finalMessages[finalMessages.length - 1];
      const prevMsg = finalMessages[finalMessages.length - 2];
      if (lastUserMsg.role === 'user' && prevMsg.role === 'agent' && ( (prevMsg.content || '').includes('[DIFUSION]') || (prevMsg.content || '').includes('[Plantilla Enviada:') )) {
          const contentLower = (lastUserMsg.content || '').toLowerCase().trim();
          const positiveWords = ['si', 'sí', 's', 'claro', 'info', 'interesa', 'precio', 'quiero', 'mas', 'más', 'dale', 'porfa', 'favor', 'muestrame', 'sii', 'siii', 'bueno', 'hágale', 'hagale', 'ok', 'okay'];
          const negativeWords = ['no', 'nunca', 'jamas', 'jamás', 'deja', 'dejen', 'cancelar', 'stop'];
          const isNegative = negativeWords.some(w => contentLower.includes(w) || contentLower === w);
          if (!isNegative && positiveWords.some(w => contentLower.includes(w) || contentLower === w)) {
              isRespondingToDifusion = true;
          }
      }
  }

  const aiMessages = [
      { role: 'system', content: `${clientSetup.prompt}\n\n[DATOS DEL CLIENTE ACTUAL: Nombre: ${senderName}]\n[FECHA Y HORA ACTUAL (BOGOTÁ): ${new Date().toLocaleString("es-CO", { timeZone: "America/Bogota", weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "numeric", hour12: true })}]\n\n${inventoryContext}` },
      
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
  ];

  const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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

  if (!aiResponse.ok) {
     const errData = await aiResponse.text();
     console.error("OpenRouter Error:", errData);
     return [];
  }

  const aiData = await aiResponse.json();
  const botReplyText = aiData.choices?.[0]?.message?.content;
  if (!botReplyText) return [];

  const needsHumanMatch = botReplyText.match(/\[NEEDS_HUMAN(?::(.*?))?\]/i);
  const humanDept = needsHumanMatch ? (needsHumanMatch[1] || '').trim().toUpperCase() : null;
  const needsHuman = needsHumanMatch && humanDept !== 'TREARQ';

  const leadStateMatch = botReplyText.match(/\[\s*LEAD_STATE\s*:\s*([^|\]]+?)\s*(?:\||,|-)\s*(\d+)\s*\]/i);
  const saleMatch = botReplyText.match(/\[SALE_CONFIRMED:\s*(.*?)\]/i);
  const citaMatch = botReplyText.match(/\[CITA_AGENDADA(?::\s*(.+?))?\]/i);
  const nameMatch = botReplyText.match(/\[CLIENT_NAME:\s*(.+?)\]/i);
  let clientNameExtracted = nameMatch ? nameMatch[1].trim() : null;

  const messageQueue = [];
  const extractionRegex = /(\[(SEND_IMAGE|SEND_VIDEO|SEND_DOCUMENT):\s*(https?:\/\/[^\]]+)\]|\[.*?\]\((https?:\/\/.*?supabase\.co\/storage.*?)\)|(https?:\/\/.*?supabase\.co\/storage\S+))/gi;
  let lastIndex = 0;
  let extractionMatch;

  const forbiddenNames = ['San Francisco', 'Macao', 'Torrejon', 'Tahoe', 'Bali', 'Java', 'Marruecos', 'Jade', 'Magna', 'Orvix', 'Zyra', 'Aluvia', 'Manantial', 'Laguna', 'Montecarlo', 'Temesi', 'Giorno', 'Burgos', 'Cima', 'Fratelo', 'Granada', 'Nyren', 'Sevilla', 'Tirso', 'Adriatico', 'Azurita', 'Barat', 'Cianita', 'Cocora', 'Dakar', 'Foresta', 'Iseo', 'Indonesia', 'Casablanca', 'Baru', 'Gili', 'Nebriza', 'Ocrea'];

  const cleanText = (text) => {
      let t = text;
      t = t.replace(/\[NEEDS_HUMAN(?:\s*:.*?)?\]/gi, '');
      t = t.replace(/\[SALE_CONFIRMED:.*?\]/gi, '');
      t = t.replace(/\[LEAD_STATE:.*?\]/gi, '');
      t = t.replace(/\[CITA_AGENDADA(?:\s*:.*?)?\]/gi, '');
      t = t.replace(/\[CLIENT_NAME(?:\s*:.*?)?\]/gi, '');
      t = t.replace(/\[TRANSFERIR_ASESOR\]/gi, '');
      t = t.replace(/\*[^\n*]{1,80}\*\s*:\s*/g, '');
      t = t.replace(/^\s*\d+\.\s*[^\n]{1,80}:\s*$/gim, '');
      for (const name of forbiddenNames) {
          const regex = new RegExp('\\b' + name + '\\b', 'gi');
          t = t.replace(regex, 'este modelo');
      }
      t = t.replace(/\n{3,}/g, '\n\n');
      return t.trim();
  };

  while ((extractionMatch = extractionRegex.exec(botReplyText)) !== null) {
      let textBefore = botReplyText.slice(lastIndex, extractionMatch.index);
      textBefore = cleanText(textBefore);
      if (textBefore) {
          const paragraphs = textBefore.split(/\n{3,}/);
          for (const p of paragraphs) {
              if (p.trim()) messageQueue.push({ type: 'text', content: p.trim() });
          }
      }
      let url = (extractionMatch[3] || extractionMatch[4] || extractionMatch[5]).trim().replace(/[\)\]\.,\"']+$/, '');
      let isVideo = extractionMatch[2] === 'SEND_VIDEO' || url.toLowerCase().match(/\.(mp4|mov|webm|avi|mkv)(\?.*)?$/);
      let isDocument = extractionMatch[2] === 'SEND_DOCUMENT' || url.toLowerCase().match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx)(\?.*)?$/);
        let msgType = isVideo ? 'video' : (isDocument ? 'document' : 'image');
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
      const paragraphs = textAfter.split(/\n{3,}/);
      for (const p of paragraphs) {
          if (p.trim()) messageQueue.push({ type: 'text', content: p.trim() });
      }
  }

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

  let stage = null;
  let score = null;
  if (leadStateMatch) {
       stage = leadStateMatch[1].trim();
       // Fix common casing issues to match Pipeline strictly
       if (stage.toLowerCase().includes('negociaci')) stage = 'Negociación';
       if (stage.toLowerCase().includes('interesado')) stage = 'Interesado';
       if (stage.toLowerCase().includes('contactado')) stage = 'Contactado';
       
       score = parseInt(leadStateMatch[2], 10);
  }
  if (saleMatch) {
       stage = 'Venta Cerrada';
       score = 100;
  }

  let finalSenderName = senderName;
  if (clientNameExtracted && clientNameExtracted.toLowerCase() !== 'cliente' && clientNameExtracted.toLowerCase() !== 'usuario') {
       finalSenderName = clientNameExtracted;
       await supabase.from('conversations').update({ user_name: finalSenderName }).eq('id', conversationId);
  }

  try {
       const { data: existingLead } = await supabase.from('leads').select('id').eq('client_id', clientId).eq('phone', senderPhone).single();
       if (existingLead) {
            const updatePayload = { name: finalSenderName };
            if (stage) updatePayload.stage = stage;
            if (score) updatePayload.score = score;
            await supabase.from('leads').update(updatePayload).eq('id', existingLead.id);
       } else {
            await supabase.from('leads').insert([{
                 client_id: clientId,
                 phone: senderPhone,
                 name: finalSenderName,
                 stage: stage || 'Nuevo',
                 score: score || 10,
                 source: channel === 'web' ? 'WebChat' : 'WhatsApp',
                 value: '$0'
            }]);
       }
  } catch(e) { console.error('Lead error', e) }

  let assignedUserId = null;
  if (clientId === 'c91119cc-5451-4a64-b0e8-6b53d33d5563') {
       assignedUserId = '2fcab0de-af97-446d-a217-bc986897cb3d'; // Daniela
  } else if (humanDept === 'TREARQ') {
       assignedUserId = '096b5cb3-9754-4581-be3c-d6c2a64caead';
  } else if (humanDept === 'ASESOR') {
       assignedUserId = '2db217bc-c72e-448a-9a8d-4b2469c93661';
  } else if (citaMatch) {
       const { data: agends } = await supabase.from('team_members').select('user_id').eq('client_id', clientId).eq('role', 'agendador').eq('status', 'activo').limit(1);
       if (agends && agends.length > 0) assignedUserId = agends[0].user_id;
  } else if (saleMatch) {
       const { data: vends } = await supabase.from('team_members').select('user_id').eq('client_id', clientId).eq('role', 'vendedor').eq('status', 'activo').limit(1);
       if (vends && vends.length > 0) assignedUserId = vends[0].user_id;
  }

  // Round Robin / Load Balancing Assignment if human needed and no specific role matched
  if (needsHuman && !assignedUserId) {
       const { data: teamMembers } = await supabase.from('team_members').select('user_id').eq('client_id', clientId);
       if (teamMembers && teamMembers.length > 0) {
           const memberIds = teamMembers.map(m => m.user_id);
           const { data: convCounts } = await supabase.from('conversations')
               .select('assigned_to')
               .eq('client_id', clientId)
               .eq('archived', false)
               .in('assigned_to', memberIds);
               
           const counts = {};
           memberIds.forEach(id => counts[id] = 0);
           if (convCounts) {
               convCounts.forEach(c => {
                   if (c.assigned_to) counts[c.assigned_to]++;
               });
           }
           // Sort by count ascending to find the agent with the fewest active chats
           memberIds.sort((a, b) => counts[a] - counts[b]);
           assignedUserId = memberIds[0];
       }
  }

  const cleanReplyForDB = cleanText(botReplyText)
      .replace(/\[.*?\]\((https?:\/\/.*?supabase\.co\/storage.*?)\)/gi, '')
      .replace(/\[CLIENT_NAME:.*?\]/i, '');
  const { data: latest } = await supabase.from('conversations').select('messages').eq('id', conversationId).single();
  let updatePayload = {
      messages: [...(latest?.messages || []), { role: 'agent', content: cleanReplyForDB, timestamp: new Date().toISOString() }],
      updated_at: new Date().toISOString(),
      needs_human: needsHuman
  };
  if (assignedUserId) updatePayload.assigned_to = assignedUserId;
  if (humanDept) updatePayload.department = humanDept;

  await supabase.from('conversations').update(updatePayload).eq('id', conversationId);

  if (leadStateMatch) {
    const newStage = leadStateMatch[1].trim();
    const newScore = parseInt(leadStateMatch[2], 10);
    try {
      const { data: existingLead } = await supabase.from('leads').select('id').eq('client_id', clientId).eq('phone', senderPhone).limit(1).single();
      if (existingLead) {
        await supabase.from('leads').update({ stage: newStage, score: newScore }).eq('id', existingLead.id);
      }
    } catch(err) { console.error('Error updating lead pipeline', err) }
  }

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
               department: humanDept === 'TREARQ' ? 'Trearq' : 'Trazzos',
               status: 'Confirmed'
            }]);
          }
       } catch(err) { console.error("Error parsing appointment date", err); }
    }
  }

  if (saleMatch && saleMatch[1]) {
    const productName = saleMatch[1].trim();
    await supabase.from('notifications').insert([{
      client_id: clientId,
      conversation_id: conversationId,
      message: `Venta cerrada: ${productName} a ${senderName}`,
      type: 'sale'
    }]);

    const { data: prod } = await supabase.from('products').select('id, stock').eq('client_id', clientId).ilike('name', `%${productName}%`).limit(1).single();
    if (prod && prod.stock > 0) {
      await supabase.from('products').update({ stock: prod.stock - 1 }).eq('id', prod.id);
    }
  }

  return messageQueue;
}
