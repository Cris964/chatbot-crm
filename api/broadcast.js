import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { clientId, leadIds, campaignText, templateName = 'alerta_promocion', isListMode = false } = req.body;

  if (!clientId || !leadIds || leadIds.length === 0) {
    return res.status(400).json({ error: 'Faltan parámetros requeridos (clientId o leadIds).' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Obtener Token de WhatsApp y Phone Number ID del Cliente
    const { data: clientData, error: clientErr } = await supabase
      .from('clients')
      .select('whatsapp_token, phone_number_id')
      .eq('id', clientId)
      .single();

    if (clientErr || !clientData || !clientData.whatsapp_token || !clientData.phone_number_id) {
      return res.status(400).json({ error: 'El cliente no tiene configurado su WhatsApp Token o Phone Number ID.' });
    }

    const { whatsapp_token: token, phone_number_id: phoneId } = clientData;

    // 2. Obtener los teléfonos de los leads seleccionados
    const tableName = isListMode ? 'broadcast_contacts' : 'remarketing_leads';
    const { data: leads, error: leadsErr } = await supabase
      .from(tableName)
      .select('id, phone')
      .in('id', leadIds);

    if (leadsErr || !leads || leads.length === 0) {
      return res.status(400).json({ error: 'No se encontraron los leads especificados.' });
    }

    let successes = 0;
    let failures = 0;

    // 3. Bucle de envío a Meta API
    const sendPromises = leads.map(async (lead) => {
      // Limpiar teléfono (solo números)
      let cleanPhone = lead.phone.replace(/\D/g, '');
      
      const payload = {
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "template",
        template: {
          name: templateName,
          language: { code: "es_CO" },
          components: [
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  text: campaignText || "Promoción especial"
                }
              ]
            }
          ]
        }
      };

      // Fallback para 'hello_world' de prueba (no requiere components)
      if (templateName === 'hello_world') {
          delete payload.template.components;
          payload.template.language = { code: "en_US" };
      }

      try {
        const response = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (response.ok) {
          successes++;
          await supabase.from(tableName).update({ status: 'messaged' }).eq('id', lead.id);
        } else {
          console.error(`Error enviando a ${cleanPhone}:`, data);
          failures++;
        }
      } catch (err) {
        console.error(`Network error para ${cleanPhone}:`, err);
        failures++;
      }
    });

    await Promise.all(sendPromises);

    return res.status(200).json({ 
      success: true, 
      message: `Difusión finalizada. Enviados: ${successes}, Fallos: ${failures}`,
      stats: { successes, failures }
    });

  } catch (err) {
    console.error("Broadcast endpoint error:", err);
    return res.status(500).json({ error: 'Error del servidor', details: err.message });
  }
}
