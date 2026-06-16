import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // Auth (Permitir CRON_SECRET de Vercel o el META_VERIFY_TOKEN para la llamada desde GitHub)
    const validTokens = [
        `Bearer ${process.env.CRON_SECRET}`,
        `Bearer ${process.env.META_VERIFY_TOKEN || 'nexus_secure_123'}`
    ];
    
    if (!validTokens.includes(req.headers.authorization)) {
        return res.status(401).send('Unauthorized');
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Configurar fechas (Ajustar a Hora Colombia GMT-5)
    const now = new Date();
    const colNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
    
    const today = colNow.toISOString().split('T')[0];
    const currentHour = colNow.getHours();
    
    // Buscar todas las citas confirmadas de hoy
    const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('date', today)
        .eq('status', 'Confirmed');

    let totalSent = 0;

    if (appointments && appointments.length > 0) {
        for (const app of appointments) {
            if (!app.time) continue;
            
            const appHour = parseInt(app.time.split(':')[0], 10);
            
            // Si la cita es exactamente en la siguiente hora (ej. si son las 7:00, avisa las citas de las 8:00)
            if (appHour === currentHour + 1) {
                const { data: clients } = await supabase.from('clients').select('*').eq('id', app.client_id).limit(1);
                if (clients && clients[0]) {
                    const clientSetup = clients[0];
                    const WHATSAPP_TOKEN = clientSetup.whatsapp_token || process.env.WHATSAPP_TOKEN;
                    const PHONE_NUMBER_ID = clientSetup.phone_number_id || process.env.PHONE_NUMBER_ID;

                    const msg = `⏰ *Recordatorio de Cita*\n\n¡Hola ${app.contact_name || ''}! Te recordamos que tienes una videollamada / reunión agendada en 1 hora (a las ${app.time}) con ${clientSetup.name}. ¡Te esperamos pronto!`;
                    
                    const phone = app.contact_phone;
                    if (phone) {
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
    }

    res.status(200).json({ status: 'ok', sent: totalSent, currentHourCol: currentHour });
}
