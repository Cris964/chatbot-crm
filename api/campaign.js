import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { action } = req.query;

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ACTION 1: NEW LEAD FROM META/GOOGLE SHEETS
    if (action === 'new_lead') {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
        
        try {
            const { name, phone, email, client_id } = req.body;
            if (!name || !phone || !client_id) return res.status(400).json({ error: 'Missing required fields' });

            const { data: clientData, error: clientErr } = await supabase.from('clients').select('whatsapp_token, phone_number_id, name').eq('id', client_id).single();
            if (clientErr || !clientData) return res.status(404).json({ error: 'Client not found' });

            let cleanPhone = phone.replace(/\D/g, '');
            if (!cleanPhone.startsWith('57')) cleanPhone = '57' + cleanPhone;

            const nextReminderAt = Math.floor(Date.now() / 1000) + (24 * 60 * 60);

            const { data: existingLead } = await supabase.from('leads').select('id').eq('phone', cleanPhone).eq('client_id', client_id).maybeSingle();

            if (existingLead) {
                await supabase.from('leads').update({ name, email, source: 'MetaAds', stage: 'Invited_Calendly', score: nextReminderAt }).eq('id', existingLead.id);
            } else {
                await supabase.from('leads').insert([{ client_id, name, phone: cleanPhone, email, source: 'MetaAds', stage: 'Invited_Calendly', score: nextReminderAt, value: '$0', status: 'active' }]);
            }

            const calendlyUrl = "https://calendly.com/trazzos-arquitectura/reunion-trazzos";
            const messageText = `¡Hola ${name}! 👋\n\nGracias por dejarnos tus datos. Somos de ${clientData.name}.\nPara brindarte una asesoría personalizada sobre tu proyecto, nos encantaría invitarte a agendar una rápida videollamada con nosotros.\n\nPor favor, elige la fecha y hora que mejor te quede aquí:\n👉 ${calendlyUrl}\n\n¡Te esperamos!`;

            const whToken = clientData.whatsapp_token || process.env.WHATSAPP_TOKEN;
            const whPhoneId = clientData.phone_number_id || process.env.PHONE_NUMBER_ID;

            if (whToken && whPhoneId) {
                await fetch(`https://graph.facebook.com/v21.0/${whPhoneId}/messages`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${whToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messaging_product: 'whatsapp', to: cleanPhone, type: 'text', text: { body: messageText } })
                });
            }
            return res.status(200).json({ success: true, message: 'Lead saved and invited' });
        } catch (e) {
            console.error('Error in new_lead:', e);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    // ACTION 2: CALENDLY WEBHOOK
    if (action === 'calendly') {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
        
        try {
            const payload = req.body;
            console.log('[CALENDLY WEBHOOK]', JSON.stringify(payload));

            if (payload.event === 'invitee.created') {
                const inviteeEmail = payload.payload.email;
                const eventUrl = payload.payload.event;

                if (inviteeEmail) {
                    const { data: leads } = await supabase.from('leads').select('id').ilike('email', `%${inviteeEmail.trim()}%`);
                    if (leads && leads.length > 0) {
                        for (const lead of leads) {
                            await supabase.from('leads').update({ stage: 'Booked_Calendly', score: 0, value: eventUrl }).eq('id', lead.id);
                        }
                    }
                }
            }
            return res.status(200).send('OK');
        } catch (e) {
            console.error('Error in calendly webhook:', e);
            return res.status(500).send('Error');
        }
    }

    // ACTION 3: CRON FOLLOWUP
    if (action === 'cron_followup') {
        if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).json({ error: 'Unauthorized' });

        try {
            const currentTimestamp = Math.floor(Date.now() / 1000);
            const { data: leadsToRemind, error } = await supabase.from('leads').select('id, name, phone, stage, score, client_id').in('stage', ['Invited_Calendly', 'Reminded_1']).gt('score', 0).lte('score', currentTimestamp);
            
            if (error) return res.status(500).json({ error: error.message });

            let sentCount = 0;
            for (const lead of leadsToRemind) {
                const { data: clientData } = await supabase.from('clients').select('whatsapp_token, phone_number_id').eq('id', lead.client_id).single();
                if (!clientData) continue;

                const whToken = clientData.whatsapp_token || process.env.WHATSAPP_TOKEN;
                const whPhoneId = clientData.phone_number_id || process.env.PHONE_NUMBER_ID;
                if (!whToken || !whPhoneId) continue;

                const calendlyUrl = "https://calendly.com/trazzos-arquitectura/reunion-trazzos";
                let messageText = '';
                let newStage = '';
                let newScore = 0;

                if (lead.stage === 'Invited_Calendly') {
                    messageText = `¡Hola ${lead.name}! ⏳\n\nVimos que aún no has agendado tu videollamada con nuestro equipo experto.\n\nRecuerda que esta asesoría es clave para ayudarte a tomar la mejor decisión sobre los acabados de tu proyecto. ¡No te tomará más de 15 minutos!\n\nAgenda tu espacio aquí: ${calendlyUrl}`;
                    newStage = 'Reminded_1';
                    newScore = currentTimestamp + (48 * 60 * 60);
                } else if (lead.stage === 'Reminded_1') {
                    messageText = `Hola ${lead.name}, soy yo de nuevo. 👋\n\nSolo quería dejarte este último mensajito por si olvidaste agendar tu asesoría para tu proyecto de remodelación.\n\nTe dejo el link una vez más por si decides aprovechar este espacio gratuito: ${calendlyUrl}\n\n¡Que tengas un excelente día!`;
                    newStage = 'Reminded_Final';
                    newScore = 0;
                }

                const wpRes = await fetch(`https://graph.facebook.com/v21.0/${whPhoneId}/messages`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${whToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messaging_product: 'whatsapp', to: lead.phone, type: 'text', text: { body: messageText } })
                });

                if (wpRes.ok) {
                    await supabase.from('leads').update({ stage: newStage, score: newScore }).eq('id', lead.id);
                    sentCount++;
                }
            }
            return res.status(200).json({ success: true, sent: sentCount });
        } catch (e) {
            console.error('CRON Error:', e);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    return res.status(404).json({ error: 'Not Found' });
}
