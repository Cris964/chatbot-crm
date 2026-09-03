import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', '*, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { conversationId, clientId } = req.body;
  if (!conversationId || !clientId) {
    return res.status(400).json({ error: 'Missing conversationId or clientId' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // --- SECURITY MIDDLEWARE ---
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }
    const token = authHeader.split(' ')[1];
    const _supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const _supabaseAnon = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const _authClient = createClient(_supabaseUrl, _supabaseAnon);
    const { data: { user }, error: authError } = await _authClient.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    // ---------------------------

    // 1. Get Client details
    const { data: clients } = await supabase.from('clients').select('id, name, prompt, model, active').eq('id', clientId).limit(1);
    const clientSetup = clients?.[0];

    if (!clientSetup || clientSetup.active === false) {
      return res.status(400).json({ error: 'Client inactive or not found' });
    }

    // 2. Get Conversation messages
    const { data: chat } = await supabase.from('conversations').select('messages').eq('id', conversationId).single();
    if (!chat || !chat.messages) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey || !clientSetup.prompt) {
      return res.status(500).json({ error: 'AI not configured' });
    }

    // 3. Get Products Context
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

    // 4. Call OpenRouter
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://chatbot-crm-xi.vercel.app/',
            'X-Title': `NexusCRM - ${clientSetup.name || 'AI Agent'}`
        },
        body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            messages: [
                { role: 'system', content: `${clientSetup.prompt}\n\n${inventoryContext}` },
                ...chat.messages.slice(-10).map(m => ({
                    role: m.role === 'agent' ? 'assistant' : 'user',
                    content: m.content
                }))
            ],
            max_tokens: 400
        })
    });

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      let aiReply = aiData.choices[0]?.message?.content || 'No pude generar respuesta.';
      
      const imageMatch = aiReply.match(/\[SEND_IMAGE:\s*(https?:\/\/[^\]]+)\]/i);
      const imageUrl = imageMatch ? imageMatch[1].trim() : null;
      aiReply = aiReply.replace(/\[SEND_IMAGE:.*?\]/i, '').trim();
      
      const newMessages = [...chat.messages, {
        role: 'agent',
        content: aiReply,
        image_url: imageUrl,
        timestamp: new Date().toISOString()
      }];

      await supabase.from('conversations').update({
        messages: newMessages,
        updated_at: new Date().toISOString()
      }).eq('id', conversationId);

      return res.status(200).json({ success: true, reply: aiReply });
    } else {
      const errBody = await aiResponse.text();
      return res.status(500).json({ error: 'AI API error', details: errBody });
    }
  } catch (err) {
    console.error("Simulation endpoint error:", err);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
}
