import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).send('Unauthorized');
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Configurar fechas
    const todayObj = new Date();
    const today = todayObj.toISOString().split('T')[0];
    
    const tomorrowObj = new Date(todayObj);
    tomorrowObj.setDate(tomorrowObj.getDate() + 1);
    const tomorrow = tomorrowObj.toISOString().split('T')[0];

    // Buscar citas para hoy y mañana
    const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .in('date', [today, tomorrow])
        .eq('status', 'Confirmed');

    let totalSent = 0;

    if (appointments && appointments.length > 0) {
        for (const app of appointments) {
            const { data: clients } = await supabase.from('clients').select('*').eq('id', app.client_id).limit(1);
            if (clients && clients[0]) {
                const clientSetup = clients[0];
                const WHATSAPP_TOKEN = clientSetup.whatsapp_token || process.env.WHATSAPP_TOKEN;
                const PHONE_NUMBER_ID = clientSetup.phone_number_id || process.env.PHONE_NUMBER_ID;

                let msg = '';
                if (app.date === today) {
                    msg = `¡Hola ${app.contact_name || ''}! Te recordamos que tienes una cita agendada hoy a las ${app.time} con ${clientSetup.name}. ¡Te esperamos!`;
                } else if (app.date === tomorrow) {
                    msg = `¡Hola ${app.contact_name || ''}! Te recordamos que tienes una cita agendada mañana a las ${app.time} con ${clientSetup.name}. ¿Nos confirmas tu asistencia?`;
                }
                
                const phone = app.contact_phone;
                if (phone && msg !== '') {
                    await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ messaging_product: 'whatsapp', to: phone, type: 'text', text: { body: msg } })
                    });
                    totalSent++;
                }
            }
        }
    }

    res.status(200).json({ status: 'ok', sent: totalSent });
}
