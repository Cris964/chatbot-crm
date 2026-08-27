import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // Basic authorization for cron execution
    const token = req.query.token || req.body?.token;
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}` && token !== 'n3xus_cron_2026') {
        return res.status(401).send('Unauthorized');
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const SAMARITANA_CLIENT_ID = 'f920ca15-badb-4492-a344-e8d04f9f8c02';
    
    const now = new Date();
    // Buscamos chats que no se han actualizado en 12 horas, pero no más viejos de 48 horas.
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

    console.log(`Ejecutando Cron de La Samaritana. Rango: ${fortyEightHoursAgo} a ${twelveHoursAgo}`);

    let totalProcessed = 0;

    const { data: convs, error: convsErr } = await supabase
        .from('conversations')
        .select('id, user_phone, messages, archived, channel, updated_at')
        .eq('client_id', SAMARITANA_CLIENT_ID)
        .eq('archived', false)
        .lte('updated_at', twelveHoursAgo)
        .gte('updated_at', fortyEightHoursAgo);

    if (convsErr) {
        console.error("Error fetching conversations:", convsErr);
        return res.status(500).json({ error: convsErr.message });
    }

    if (!convs || convs.length === 0) {
        return res.status(200).json({ message: "No hay chats que cumplan el criterio de 12-24h." });
    }

    const { data: clientData } = await supabase.from('clients').select('whatsapp_token, phone_number_id').eq('id', SAMARITANA_CLIENT_ID).single();
    if (!clientData || !clientData.whatsapp_token || !clientData.phone_number_id) {
        return res.status(500).json({ error: "Client WhatsApp config missing." });
    }

    for (const c of convs) {
        if (c.channel !== 'whatsapp') continue;

        const msgs = c.messages || [];
        if (msgs.length === 0) continue;

        // Verificar si ya se envió el seguimiento
        const hasFollowup = msgs.some(m => m.content && m.content.includes('[SEGUIMIENTO AUTOMÁTICO ENVIADO]'));
        if (hasFollowup) continue;

        // Verificar si el último mensaje fue del agente
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg.role === 'user') continue; // Si el último mensaje es del usuario, no hacemos seguimiento aún

        // Extraer últimos 10 mensajes para contexto
        const recentMsgs = msgs.slice(-10).map(m => ({
            role: m.role === 'agent' ? 'assistant' : m.role,
            content: m.content
        }));

        const systemPrompt = `Eres un clasificador experto de intenciones de clientes de WhatsApp. 
Vas a leer una conversación reciente entre un usuario y la tienda "La Samaritana".
Tu única tarea es clasificar al cliente en una de estas dos categorías y responder ÚNICAMENTE con la palabra exacta (en mayúsculas):

- INTERESADOS: El cliente hizo preguntas específicas sobre productos, características, precios, mostró interés real de compra, pero de repente dejó de responder.
- RECORDACION: El cliente solo saludó, dijo "hola", pidió el catálogo de forma automática o dio respuestas muy básicas/secas sin avanzar en la conversación, y nunca más respondió.

Responde ÚNICAMENTE con la palabra "INTERESADOS" o "RECORDACION".`;

        try {
            console.log(`Evaluando chat de ${c.user_phone}...`);
            const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    model: 'openai/gpt-4o-mini',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...recentMsgs
                    ],
                    temperature: 0.1,
                    max_tokens: 10
                })
            });

            if (aiRes.ok) {
                const aiData = await aiRes.json();
                let classification = aiData.choices[0].message.content.trim().toUpperCase();
                
                // Limpieza por si la IA añade puntos o algo extra
                if (classification.includes('INTERESADOS')) classification = 'interesados';
                else classification = 'recordacion';

                console.log(`- Clasificación: ${classification}`);

                // Despachar Plantilla a Meta
                const metaPayload = {
                    messaging_product: "whatsapp",
                    to: c.user_phone,
                    type: "template",
                    template: {
                        name: classification,
                        language: { code: "es" }
                    }
                };

                const metaRes = await fetch(`https://graph.facebook.com/v21.0/${clientData.phone_number_id}/messages`, {
                    method: 'POST',
                    headers: { 
                        'Authorization': `Bearer ${clientData.whatsapp_token}`, 
                        'Content-Type': 'application/json' 
                    },
                    body: JSON.stringify(metaPayload)
                });

                if (metaRes.ok) {
                    // Guardar registro en el chat
                    msgs.push({ 
                        role: 'agent', 
                        content: `[SEGUIMIENTO AUTOMÁTICO ENVIADO]: Plantilla '${classification}' enviada tras 12h de inactividad.`, 
                        timestamp: new Date().toISOString() 
                    });
                    await supabase.from('conversations').update({ 
                        messages: msgs, 
                        updated_at: new Date().toISOString() // Actualizamos para que vuelva a contar desde hoy si fuera necesario
                    }).eq('id', c.id);
                    
                    totalProcessed++;
                } else {
                    const errJson = await metaRes.json();
                    console.error(`- Meta API Error para ${c.user_phone}:`, errJson);
                }
            } else {
                console.error("- OpenRouter API Error", await aiRes.text());
            }
        } catch (e) {
            console.error(`Error procesando chat ${c.user_phone}:`, e);
        }
    }

    return res.status(200).json({ message: "Cron completado.", processed: totalProcessed });
}
