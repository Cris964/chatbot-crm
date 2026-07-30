import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    const token = req.query.token || req.body?.token;
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}` && token !== 'n3xus_cron_2026') {
        return res.status(401).send('Unauthorized');
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Este script puede ser ejecutado externamente cada 1 hora o 4 horas.
    // Escanea conversaciones activas que no han tenido respuesta en al menos 4 horas.
    const now = new Date();
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString();

    let totalSent = 0;

    const { data: convs } = await supabase
        .from('conversations')
        .select('id, user_phone, client_id, messages, archived, channel, updated_at')
        .eq('archived', false)
        .lte('updated_at', fourHoursAgo); // Solo revisar los que llevan más de 4 horas sin actividad

    if (convs) {
        for (const c of convs) {
            if (c.channel === 'web') continue; // Solo WhatsApp

            const msgs = c.messages || [];
            if (msgs.length < 2) continue;

            // Contar cuántos mensajes consecutivos del agente hay al final
            let consecutiveAgents = 0;
            for (let i = msgs.length - 1; i >= 0; i--) {
                if (msgs[i].role === 'agent' || msgs[i].role === 'assistant') consecutiveAgents++;
                else break;
            }

            // Si el último mensaje es del usuario (consecutiveAgents == 0), no hacemos remarketing.
            // Si hay 4 o más, ya agotamos los intentos.
            if (consecutiveAgents === 0 || consecutiveAgents >= 4) continue;

            const timeSinceLastUpdateMs = now.getTime() - new Date(c.updated_at).getTime();
            const hoursSince = timeSinceLastUpdateMs / (1000 * 60 * 60);

            // Reglas de Drip Campaign:
            // Intento 1 (4h): consecutiveAgents == 1 y hours >= 4
            // Intento 2 (24h): consecutiveAgents == 2 y hours >= 24
            // Intento 3 (48h): consecutiveAgents == 3 y hours >= 48
            let shouldSend = false;
            let attempt = 0;

            if (consecutiveAgents === 1 && hoursSince >= 4) { shouldSend = true; attempt = 1; }
            else if (consecutiveAgents === 2 && hoursSince >= 24) { shouldSend = true; attempt = 2; }
            else if (consecutiveAgents === 3 && hoursSince >= 48) { shouldSend = true; attempt = 3; }

            if (shouldSend) {
                console.log(`Remarketing intento ${attempt} para ${c.user_phone}`);

                const { data: clients } = await supabase.from('clients').select('*').eq('id', c.client_id).limit(1);
                if (clients && clients[0] && clients[0].active !== false) {
                    const clientSetup = clients[0];
                    
                    let instruction = "";
                    if (attempt === 1) instruction = "El cliente lleva 4 horas sin responder. Hazle una pregunta muy corta y amigable para saber si pudo ver la información o si tiene dudas.";
                    else if (attempt === 2) instruction = "El cliente lleva 24 horas sin responder. Salúdalo y pregúntale si sigue interesado o si le gustaría agendar una reunión virtual para revisar opciones.";
                    else if (attempt === 3) instruction = "El cliente lleva 48 horas sin responder. Envíale un último mensaje de seguimiento muy empático indicando que estás ahí para cuando esté listo para retomar su proyecto.";

                    const prompt = `${clientSetup.prompt}\n\n[INSTRUCCIÓN DEL SISTEMA]: ${instruction} MÁXIMO 1 PÁRRAFO CORTO.`;
                    
                    const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            model: 'openai/gpt-4o-mini',
                            messages: [
                                { role: 'system', content: prompt },
                                ...msgs.slice(-5)
                            ]
                        })
                    });

                    if (aiRes.ok) {
                        const aiData = await aiRes.json();
                        const reply = aiData.choices[0].message.content;

                        const WHATSAPP_TOKEN = clientSetup.whatsapp_token || process.env.WHATSAPP_TOKEN;
                        const PHONE_NUMBER_ID = clientSetup.phone_number_id || process.env.PHONE_NUMBER_ID;

                        await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ messaging_product: 'whatsapp', to: c.user_phone, type: 'text', text: { body: reply } })
                        });

                        msgs.push({ role: 'agent', content: reply, timestamp: new Date().toISOString() });
                        await supabase.from('conversations').update({ messages: msgs, updated_at: new Date().toISOString() }).eq('id', c.id);
                        totalSent++;
                    }
                }
            }
        }
    }

    res.status(200).json({ status: 'ok', sent: totalSent });
}
