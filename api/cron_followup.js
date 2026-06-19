import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Security check for cron secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}` && !req.headers['user-agent']?.includes('Vercel-Cron')) {
      console.log('Unauthorized cron call attempt');
      return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('--- Iniciando Cron de Seguimiento de Conversaciones Inactivas ---');
  
  try {
    const now = new Date();
    const nowMs = now.getTime();

    // Buscar conversaciones NO archivadas, y que NO necesiten humano
    const { data: conversations, error: convErr } = await supabase
      .from('conversations')
      .select('*, clients(whatsapp_token, phone_number_id, name, prompt)')
      .eq('archived', false)
      .eq('needs_human', false)
      .not('messages', 'is', null);

    if (convErr) {
        console.error('Error fetching conversations:', convErr);
        return res.status(500).json({ error: convErr.message });
    }

    let processedCount = 0;

    for (const conv of conversations) {
        const clientSetup = conv.clients;
        if (!clientSetup?.whatsapp_token || !clientSetup?.phone_number_id) continue;
        
        const messages = conv.messages || [];
        if (messages.length === 0) continue;
        
        const lastMsg = messages[messages.length - 1];
        // Si el último mensaje es del usuario, NO hay inactividad por su parte, nosotros debemos responder.
        if (lastMsg.role === 'user') continue;

        // Si llegamos aquí, el último mensaje fue del agente.
        // Calculamos tiempo transcurrido desde la última interacción de la conversación (updated_at)
        let lastInteractionTime = conv.updated_at ? new Date(conv.updated_at.endsWith('Z') ? conv.updated_at : conv.updated_at + 'Z').getTime() : null;
        if (!lastInteractionTime) {
            // Fallback al timestamp del mensaje
            lastInteractionTime = lastMsg.timestamp ? new Date(lastMsg.timestamp.endsWith('Z') ? lastMsg.timestamp : lastMsg.timestamp + 'Z').getTime() : nowMs;
        }

        const hoursSinceLastMsg = (nowMs - lastInteractionTime) / (1000 * 60 * 60);
        const followupCount = conv.followup_count || 0;
        
        let shouldSend = false;
        let followupType = '';

        if (followupCount === 0 && hoursSinceLastMsg >= 2) {
            shouldSend = true;
            followupType = 'Recordatorio inicial rápido (2 horas). Pregunta cortésmente si pudo revisar la información o si tiene alguna duda.';
        } else if (followupCount === 1 && hoursSinceLastMsg >= 24) {
            shouldSend = true;
            followupType = 'Recordatorio del día siguiente (24 horas). Destaca algún beneficio de los productos/servicios y pregunta cómo podemos avanzar.';
        } else if (followupCount === 2 && hoursSinceLastMsg >= 72) {
            shouldSend = true;
            followupType = 'Último seguimiento (3 días). Deja la puerta abierta amablemente para cuando esté listo para remodelar o comprar.';
        }

        if (shouldSend) {
            console.log(`[FOLLOW-UP] Generando mensaje de seguimiento etapa ${followupCount + 1} para: ${conv.user_phone}`);
            
            const aiMessages = [
                { role: 'system', content: `${clientSetup.prompt || 'Eres Cami de Trazzos.'}\n\n[INSTRUCCIÓN CRÍTICA DE SEGUIMIENTO AUTOMÁTICO]\nEl cliente ha dejado de responder hace varias horas. Tu tarea es generar un mensaje de seguimiento CORTÉS, CORTO Y NATURAL.\n\nTIPO DE SEGUIMIENTO ACTUAL: ${followupType}\n\nREGLAS DE ORO:\n1. NUNCA menciones que eres una IA.\n2. NO le ofrezcas fotos si ya se las ofreciste.\n3. HAZ UNA PREGUNTA CORTA para reabrir la conversación.\n4. MENSAJE CORTO. MÁXIMO UN PÁRRAFO.` },
                ...messages.slice(-10).map(m => {
                    let text = m.content || m.text || '';
                    if (text.includes('[IMAGEN_BASE64_URL]:')) {
                        text = text.replace(/\[IMAGEN_BASE64_URL\]:.*?$/, '[Imagen enviada]');
                    }
                    return { role: m.role === 'agent' ? 'assistant' : 'user', content: text };
                })
            ];

            const openRouterKey = process.env.OPENROUTER_API_KEY;
            let followUpText = "Hola, ¿pudiste revisar la información? Cuéntame si tienes alguna duda."; // Fallback

            try {
                const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${openRouterKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://chatbot-crm-xi.vercel.app/'
                    },
                    body: JSON.stringify({
                        model: 'openai/gpt-4o',
                        messages: aiMessages,
                        max_tokens: 200,
                        temperature: 0.7
                    })
                });

                if (aiResponse.ok) {
                    const aiData = await aiResponse.json();
                    if (aiData.choices?.[0]?.message?.content) {
                        followUpText = aiData.choices[0].message.content.trim();
                    }
                }
            } catch (e) {
                console.error('Error LLM FollowUp:', e);
            }

            // Cleanup tags just in case
            followUpText = followUpText.replace(/\[NEEDS_HUMAN(?::.*?)?\]/gi, '')
                                       .replace(/\[LEAD_STATE:.*?\]/gi, '')
                                       .replace(/\[CLIENT_NAME:.*?\]/gi, '').trim();

            // Guardar el mensaje y actualizar el contador
            const newMessages = [...messages, { role: 'agent', content: followUpText, timestamp: new Date().toISOString() }];
            
            await supabase.from('conversations').update({ 
                messages: newMessages,
                updated_at: new Date().toISOString(),
                followup_count: followupCount + 1,
                last_followup_at: new Date().toISOString()
            }).eq('id', conv.id);

            // Enviar por WhatsApp
            await fetch(`https://graph.facebook.com/v21.0/${clientSetup.phone_number_id}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${clientSetup.whatsapp_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: conv.user_phone,
                    type: 'text',
                    text: { body: followUpText }
                })
            });

            processedCount++;
        }
    }

    console.log(`Cron finalizado. Mensajes de seguimiento enviados: ${processedCount}`);
    return res.status(200).json({ success: true, sent: processedCount });

  } catch (error) {
    console.error("Cron followup exception:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
