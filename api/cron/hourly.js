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
    
    // Trazzos Official Client ID
    const TRAZZOS_CLIENT_ID = 'c90f532b-0b32-4614-9c21-bbf664213468';
    
    const now = new Date();
    // Buscamos chats que no se han actualizado en 12 horas, con un margen hasta 48 horas (para cron diario).
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

    console.log(`Ejecutando Cron Diario para Trazzos. Rango: ${fortyEightHoursAgo} a ${twelveHoursAgo}`);

    let totalProcessed = 0;

    const { data: convs, error: convsErr } = await supabase
        .from('conversations')
        .select('id, user_phone, messages, archived, channel, updated_at')
        .eq('client_id', TRAZZOS_CLIENT_ID)
        .eq('archived', false)
        .lte('updated_at', twelveHoursAgo)
        .gte('updated_at', fortyEightHoursAgo);

    if (convsErr) {
        console.error("Error fetching conversations:", convsErr);
        return res.status(500).json({ error: convsErr.message });
    }

    if (!convs || convs.length === 0) {
        return res.status(200).json({ message: "No hay chats que cumplan el criterio de inactividad de 12h." });
    }

    const { data: clientData } = await supabase.from('clients').select('whatsapp_token, phone_number_id').eq('id', TRAZZOS_CLIENT_ID).single();
    if (!clientData || !clientData.whatsapp_token || !clientData.phone_number_id) {
        return res.status(500).json({ error: "Client WhatsApp config missing for Trazzos." });
    }

    for (const c of convs) {
        if (c.channel !== 'whatsapp') continue;
        if (c.user_phone && c.user_phone.length > 14) continue; // Skip CTWA masked IDs since templates are blocked

        const msgs = c.messages || [];
        if (msgs.length === 0) continue;

        // Verificar si ya se envió el seguimiento
        const hasFollowup = msgs.some(m => m.content && m.content.includes('[REMARKETING ENVIADO]'));
        if (hasFollowup) continue;

        // Verificar si el último mensaje fue del agente
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg.role === 'user') continue; // Si el último mensaje es del usuario, no hacemos seguimiento aún

        try {
            console.log(`Enviando remarketing a ${c.user_phone}...`);

            // Despachar Plantilla a Meta
            const metaPayload = {
                messaging_product: "whatsapp",
                to: c.user_phone,
                type: "template",
                template: {
                    name: "contacto_treshoras",
                    language: { code: "es" }
                }
            };

            const metaRes = await fetch(`https://graph.facebook.com/v19.0/${clientData.phone_number_id}/messages`, {
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
                    content: `[REMARKETING ENVIADO]: Plantilla 'contacto_treshoras' enviada tras 12 horas de inactividad.`, 
                    timestamp: new Date().toISOString() 
                });
                await supabase.from('conversations').update({ 
                    messages: msgs, 
                    updated_at: new Date().toISOString() // Actualizamos para que vuelva a contar el tiempo si fuera necesario
                }).eq('id', c.id);
                
                totalProcessed++;
            } else {
                const errJson = await metaRes.json();
                console.error(`- Meta API Error para ${c.user_phone}:`, errJson);
            }
        } catch (e) {
            console.error(`Error procesando chat ${c.user_phone}:`, e);
        }
        
        // Pequeña pausa para no saturar Meta
        await new Promise(r => setTimeout(r, 200));
    }
    
        
    // ------------------------------------------------------------
    // LOGICA 2: REASIGNACIÓN AUTOMÁTICA (Agentes inactivos > 2 horas)
    // ------------------------------------------------------------
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
    
    // Obtenemos conversaciones activas que requieren humano y están asignadas
    const { data: reassignmentConvs } = await supabase
        .from('conversations')
        .select('id, client_id, assigned_to, messages, updated_at')
        .eq('archived', false)
        .eq('needs_human', true)
        .not('assigned_to', 'is', null)
        .lte('updated_at', twoHoursAgo);

    if (reassignmentConvs && reassignmentConvs.length > 0) {
        // Agrupar por client_id para optimizar carga de team_members
        const clientMembersMap = {};
        let reassignCount = 0;
        
        for (const c of reassignmentConvs) {
            const msgs = c.messages || [];
            if (msgs.length === 0) continue;
            
            const lastMsg = msgs[msgs.length - 1];
            
            // Si el último mensaje NO es del usuario, el agente SÍ respondió o fue un bot
            if (lastMsg.role !== 'user') continue;
            
            // Verificamos el tiempo exacto del último mensaje del usuario
            const lastMsgTime = new Date(lastMsg.timestamp || lastMsg.time || 0);
            const hoursPassed = (now - lastMsgTime) / (1000 * 60 * 60);
            
            if (hoursPassed > 2) {
                // Hay que reasignar
                if (!clientMembersMap[c.client_id]) {
                    const { data: members } = await supabase.from('team_members')
                        .select('user_id')
                        .eq('client_id', c.client_id)
                        .eq('status', 'activo')
                        .neq('role', 'admin')
                        .order('id', { ascending: true });
                    clientMembersMap[c.client_id] = members || [];
                }
                
                const members = clientMembersMap[c.client_id];
                if (members.length > 1) {
                    // Evitamos asignar al mismo agente. Escogemos otro aleatoriamente o al azar simple.
                    const otherMembers = members.filter(m => m.user_id !== c.assigned_to);
                    if (otherMembers.length > 0) {
                        const nextMember = otherMembers[Math.floor(Math.random() * otherMembers.length)].user_id;
                        
                        msgs.push({
                            role: 'system',
                            content: '[SISTEMA]: Chat reasignado automáticamente por inactividad del agente anterior (> 2 horas).',
                            timestamp: new Date().toISOString()
                        });
                        
                        await supabase.from('conversations').update({
                            assigned_to: nextMember,
                            messages: msgs,
                            updated_at: new Date().toISOString()
                        }).eq('id', c.id);
                        
                        reassignCount++;
                        console.log(`Chat ${c.id} reasignado de ${c.assigned_to} a ${nextMember}`);
                    }
                }
            }
        }
        console.log(`Total chats reasignados por inactividad: ${reassignCount}`);
    }
    // ------------------------------------------------------------

    return res.status(200).json({ message: "Cron Hourly completado.", processed: totalProcessed });
}