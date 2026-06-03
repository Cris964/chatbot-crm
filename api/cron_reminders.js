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

    // Buscar citas para enviar recordatorio 24h
    const { data: appts24h, error: err24 } = await supabase
      .from('appointments')
      .select('*, clients(whatsapp_token, phone_number_id, name)')
      .eq('status', 'scheduled')
      .eq('reminder_24h_sent', false)
      .gte('appointment_date', new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString())
      .lte('appointment_date', new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString());

    if (err24) console.error("Error fetching 24h appointments:", err24);

    // Buscar citas para hoy (se asume que este cron corre cada hora, pero a las 8 AM detecta las de hoy)
    // Buscamos citas agendadas para el día actual que no tengan recordatorio
    const todayStart = new Date(now);
    todayStart.setHours(0,0,0,0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23,59,59,999);

    const { data: apptsToday, error: errToday } = await supabase
      .from('appointments')
      .select('*, clients(whatsapp_token, phone_number_id, name)')
      .eq('status', 'scheduled')
      .eq('reminder_today_sent', false)
      .gte('appointment_date', todayStart.toISOString())
      .lte('appointment_date', todayEnd.toISOString());
    
    if (errToday) console.error("Error fetching today appointments:", errToday);

    const is8AM = now.getHours() === 8 || now.getHours() === 13; // Ajustar por zona horaria de Vercel (UTC). 8 AM EST/COT = 13:00 UTC.

    let sentCount = 0;

    // Procesar Recordatorios de 24 horas
    if (appts24h && appts24h.length > 0) {
      for (const appt of appts24h) {
         const clientSetup = appt.clients;
         if (!clientSetup?.whatsapp_token || !clientSetup?.phone_number_id) continue;
         
         const aptDate = new Date(appt.appointment_date);
         const timeStr = aptDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
         const msg = `Hola${appt.name ? ' ' + appt.name : ''}, te recordamos tu cita de asesoría con ${clientSetup.name || 'nosotros'} programada para mañana a las ${timeStr}. ¡Te esperamos!`;
         
         await sendWhatsApp(clientSetup.whatsapp_token, clientSetup.phone_number_id, appt.phone, msg);
         await supabase.from('appointments').update({ reminder_24h_sent: true }).eq('id', appt.id);
         sentCount++;
      }
    }

    // Procesar Recordatorios de Hoy (solo si es la hora adecuada)
    if (is8AM && apptsToday && apptsToday.length > 0) {
      for (const appt of apptsToday) {
         // Si la cita es muy temprano y ya pasó, la saltamos
         if (new Date(appt.appointment_date) < now) {
             await supabase.from('appointments').update({ reminder_today_sent: true }).eq('id', appt.id);
             continue;
         }

         const clientSetup = appt.clients;
         if (!clientSetup?.whatsapp_token || !clientSetup?.phone_number_id) continue;
         
         const aptDate = new Date(appt.appointment_date);
         const timeStr = aptDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
         const msg = `Hola${appt.name ? ' ' + appt.name : ''}, te recordamos que tienes una cita de asesoría con ${clientSetup.name || 'nosotros'} HOY a las ${timeStr}. ¡Te esperamos!`;
         
         await sendWhatsApp(clientSetup.whatsapp_token, clientSetup.phone_number_id, appt.phone, msg);
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
