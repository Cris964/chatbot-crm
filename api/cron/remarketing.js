import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).send('Unauthorized');
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Find conversations updated between 6-7, 12-13, and 24-25 hours ago
    const now = new Date();
    
    const timeRanges = [
        { hours: 6, label: "6_horas" },
        { hours: 12, label: "12_horas" },
        { hours: 24, label: "24_horas" }
    ];

    let totalSent = 0;

    for (const range of timeRanges) {
        const start = new Date(now.getTime() - (range.hours + 1) * 60 * 60 * 1000).toISOString();
        const end = new Date(now.getTime() - range.hours * 60 * 60 * 1000).toISOString();

        // Need to check leads that are active and conversations that match the time
        const { data: convs } = await supabase
            .from('conversations')
            .select('id, user_phone, client_id, messages')
            .gte('updated_at', start)
            .lte('updated_at', end);

        if (convs) {
            for (const c of convs) {
                // Determine if last message was from agent
                const msgs = c.messages || [];
                const lastMsg = msgs[msgs.length - 1];
                if (lastMsg && lastMsg.role === 'agent') {
                    // Send remarketing ping to AI to generate a follow up
                    console.log(`Remarketing needed for ${c.user_phone} (${range.label})`);
                    // Here we trigger the internal AI by making a local POST to webhook or process it directly
                    // To avoid duplicating logic, we can just insert a synthetic user message [REMARKETING_PING]
                    // But actually, it's safer to just send a simple template message directly to WhatsApp or ask OpenRouter.
                    
                    // We'll insert a synthetic message and call the webhook logic, but for simplicity:
                    // Just fetch client setup and call OpenAI
                    const { data: clients } = await supabase.from('clients').select('*').eq('id', c.client_id).limit(1);
                    if (clients && clients[0]) {
                        const clientSetup = clients[0];
                        const prompt = `${clientSetup.prompt}\n\n[INSTRUCCIÓN DEL SISTEMA]: El cliente lleva ${range.hours} horas sin responder. Escríbele un mensaje SÚPER CORTO, natural y persuasivo preguntándole si tiene alguna duda, si pudo ver la información o si quiere agendar. Máximo 1 párrafo.`;
                        
                        const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                model: 'openai/gpt-4o',
                                messages: [
                                    { role: 'system', content: prompt },
                                    ...msgs.slice(-5)
                                ]
                            })
                        });

                        if (aiRes.ok) {
                            const aiData = await aiRes.json();
                            const reply = aiData.choices[0].message.content;

                            // Send to WhatsApp
                            const WHATSAPP_TOKEN = clientSetup.whatsapp_token || process.env.WHATSAPP_TOKEN;
                            const PHONE_NUMBER_ID = clientSetup.phone_number_id || process.env.PHONE_NUMBER_ID;

                            await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
                                body: JSON.stringify({ messaging_product: 'whatsapp', to: c.user_phone, type: 'text', text: { body: reply } })
                            });

                            // Save to DB
                            msgs.push({ role: 'agent', content: reply, timestamp: new Date().toISOString() });
                            await supabase.from('conversations').update({ messages: msgs, updated_at: new Date().toISOString() }).eq('id', c.id);
                            totalSent++;
                        }
                    }
                }
            }
        }
    }

    res.status(200).json({ status: 'ok', sent: totalSent });
}
