import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const payload = req.body;
        console.log('Calendly Webhook Received:', JSON.stringify(payload));

        if (payload.event === 'invitee.created') {
            const invitee = payload.payload;
            const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
            
            // Buscar el cliente Trazzos o Trearq basado en el link de la reunion
            const eventUrl = invitee.event ? invitee.event : '';
            let department = 'Trazzos';
            if (eventUrl.includes('trearq') || eventUrl.includes('arquitectura')) {
                department = 'Trearq';
            }

            const startTime = new Date(invitee.start_time);
            const dateStr = startTime.toISOString().split('T')[0];
            const timeStr = startTime.toISOString().split('T')[1].slice(0, 5);
            
            const clientId = 'c90f532b-0b32-4614-9c21-bbf664213468'; // Trazzos

            const { error } = await supabase.from('appointments').insert([{
                client_id: clientId,
                title: 'Reunión de ' + department + ' (Calendly)',
                date: dateStr,
                time: timeStr,
                contact_name: invitee.name,
                contact_phone: invitee.text_reminder_number || invitee.questions_and_answers?.find(q => q.question.toLowerCase().includes('telefono') || q.question.toLowerCase().includes('celular'))?.answer || null,
                department: department,
                status: 'Confirmed'
            }]);

            if (error) console.error('Error inserting appointment from Calendly:', error);
        }

        res.status(200).json({ status: 'success' });
    } catch (err) {
        console.error('Calendly webhook error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
