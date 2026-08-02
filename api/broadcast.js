import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // --- GET Handler for Fetching Lists and Contacts (Bypassing RLS) ---
  if (req.method === 'GET') {
    const { action, clientId, listId } = req.query;
    
    try {
      if (action === 'get_lists') {
        if (!clientId) return res.status(400).json({ error: 'Missing clientId' });
        const { data, error } = await supabase
          .from('broadcast_lists')
          .select('*, broadcast_contacts(count)')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return res.status(200).json({ lists: data });
      } 
      
      if (action === 'get_contacts') {
        if (!listId) return res.status(400).json({ error: 'Missing listId' });
        const { data, error } = await supabase
          .from('broadcast_contacts')
          .select('*')
          .eq('list_id', listId)
          .order('full_name', { ascending: true });
        if (error) throw error;
        return res.status(200).json({ contacts: data });
      }
      
      return res.status(400).json({ error: 'Invalid GET action' });
    } catch (err) {
      console.error("GET Error in broadcast API:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  // --- POST Handler for Sending Broadcasts ---
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { clientId, leadIds, campaignText, templateName = 'alerta_promocion', isListMode = false, listId, isFreeMessage = false, mediaUrl, mediaType } = req.body;

  if (!clientId || !leadIds || leadIds.length === 0) {
    return res.status(400).json({ error: 'Faltan parámetros requeridos (clientId o leadIds).' });
  }

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
    const tableName = isListMode ? 'broadcast_contacts' : 'leads';
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
      let payload = {};
      
      if (isFreeMessage) {
        // PAYLOAD PARA MENSAJE LIBRE
        payload = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanPhone
        };
        
        if (mediaUrl) {
          const finalType = mediaType === 'audio' ? 'audio' : (mediaType === 'video' ? 'video' : (mediaType === 'image' ? 'image' : 'document'));
          payload.type = finalType;
          payload[finalType] = { link: mediaUrl };
          if (campaignText && finalType !== 'audio') {
            payload[finalType].caption = campaignText;
          }
        } else {
          payload.type = "text";
          payload.text = { body: campaignText || "Promoción especial" };
        }
      } else {
        // PAYLOAD PARA PLANTILLA
        payload = {
          messaging_product: "whatsapp",
          to: cleanPhone,
          type: "template",
          template: {
            name: templateName,
            language: { code: "es_CO" },
            components: []
          }
        };
        
        // Agregar Header Multimedia si existe
        if (mediaUrl) {
           const finalType = mediaType === 'video' ? 'video' : (mediaType === 'image' ? 'image' : 'document');
           payload.template.components.push({
             type: "header",
             parameters: [
               {
                 type: finalType,
                 [finalType]: { link: mediaUrl }
               }
             ]
           });
        }
        
        // Agregar Body
        if (templateName === 'hello_world') {
            delete payload.template.components;
            payload.template.language = { code: "en_US" };
        } else {
            if (campaignText) {
              payload.template.components.push({
                type: "body",
                parameters: [
                  {
                    type: "text",
                    text: campaignText
                  }
                ]
              });
            } else if (!mediaUrl) {
              payload.template.components.push({
                type: "body",
                parameters: [{ type: "text", text: "Promoción especial" }]
              });
            }
        }
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
          if (isListMode) {
            await supabase.from('broadcast_contacts').update({ status: 'messaged' }).eq('id', lead.id);
            if (listId) {
              const { data: existingChats } = await supabase.from('conversations').select('id, messages').eq('client_id', clientId).eq('user_phone', cleanPhone).limit(1);
              const newMsgNode = {
                 role: 'agent',
                 content: `[DIFUSIÓN]: ${campaignText ? campaignText : 'Plantilla ' + templateName}`,
                 timestamp: new Date().toISOString(),
                 is_broadcast: true,
                 list_id: listId
              };
              if (existingChats && existingChats.length > 0) {
                 const chat = existingChats[0];
                 await supabase.from('conversations').update({
                     messages: [...(chat.messages || []), newMsgNode],
                     updated_at: new Date().toISOString()
                 }).eq('id', chat.id);
              } else {
                 await supabase.from('conversations').insert([{
                     client_id: clientId,
                     user_phone: cleanPhone,
                     user_name: lead.name || 'Contacto',
                     messages: [newMsgNode],
                     channel: 'whatsapp'
                 }]);
              }
            }
          } else {
             // Do not set status in 'leads' table to avoid overriding 'active' with 'messaged'.
             // You can add a 'remarketing_status' column in the future if needed.
          }
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
