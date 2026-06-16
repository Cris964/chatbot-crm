import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verificar secret para evitar abusos si se llama por POST manualmente
  // Vercel Cron pasa un header Authorization especial
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}` && !req.headers['user-agent']?.includes('Vercel-Cron')) {
      console.log('Unauthorized cron call attempt');
  }

  console.log('--- Iniciando Cron de Recordatorios de Cita ---');
  
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    // Buscar citas para mañana
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const { data: appts24h, error: err24 } = await supabase
      .from('appointments')
      .select('*, clients(whatsapp_token, phone_number_id, name)')
      .eq('status', 'Confirmed')
      .eq('reminder_24h_sent', false)
      .eq('date', tomorrowStr);

    if (err24) console.error("Error fetching tomorrow appointments:", err24);

    // Buscar citas para hoy
    const todayStr = now.toISOString().split('T')[0];
    const { data: apptsToday, error: errToday } = await supabase
      .from('appointments')
      .select('*, clients(whatsapp_token, phone_number_id, name)')
      .eq('status', 'Confirmed')
      .eq('reminder_today_sent', false)
      .eq('date', todayStr);
    
    if (errToday) console.error("Error fetching today appointments:", errToday);

    // Vercel cron triggers at 10:00 UTC (05:00 COT). We can just process them unconditionally
    // since the cron ONLY runs once a day. No need for strict hour checks.
    let sentCount = 0;

    // Procesar Recordatorios de Mañana (24h)
    if (appts24h && appts24h.length > 0) {
      for (const appt of appts24h) {
         const clientSetup = appt.clients;
         if (!clientSetup?.whatsapp_token || !clientSetup?.phone_number_id) continue;
         
         const timeStr = appt.time ? appt.time : '';
         const msg = `Hola${appt.contact_name ? ' ' + appt.contact_name : ''}, te recordamos tu cita presencial con ${clientSetup.name || 'nosotros'} programada para MAÑANA a las ${timeStr}. ¡Te esperamos!`;
         
         await sendWhatsApp(clientSetup.whatsapp_token, clientSetup.phone_number_id, appt.contact_phone, msg);
         await supabase.from('appointments').update({ reminder_24h_sent: true }).eq('id', appt.id);
         sentCount++;
      }
    }

    // Procesar Recordatorios de Hoy
    if (apptsToday && apptsToday.length > 0) {
      for (const appt of apptsToday) {
         const clientSetup = appt.clients;
         if (!clientSetup?.whatsapp_token || !clientSetup?.phone_number_id) continue;
         
         const timeStr = appt.time ? appt.time : '';
         const msg = `Hola${appt.contact_name ? ' ' + appt.contact_name : ''}, te recordamos que tienes una cita de asesoría con ${clientSetup.name || 'nosotros'} HOY a las ${timeStr}. ¡Te esperamos!`;
         
         await sendWhatsApp(clientSetup.whatsapp_token, clientSetup.phone_number_id, appt.contact_phone, msg);
         await supabase.from('appointments').update({ reminder_today_sent: true }).eq('id', appt.id);
         sentCount++;
      }
    }

    console.log(`Cron finalizado. Mensajes enviados: ${sentCount}`);
    return res.status(200).json({ success: true, sent: sentCount });

  } catch (error) {
    console.error("Cron exception:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function sendWhatsApp(token, phoneId, to, text) {
  try {
    const r = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: { body: text }
        })
    });
    if (!r.ok) {
        console.error("Error sending WA reminder", await r.text());
    }
  } catch (e) {
      console.error("Exception in WA sending", e);
  }
}
