import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // --- POST Actions (Bypassing RLS for create_list and add_contact) ---
  if (req.method === 'POST' && req.body.action === 'create_list') {
    const { clientId, name } = req.body;
    if (!clientId || !name) return res.status(400).json({ error: 'Missing clientId or name' });
    const { data, error } = await supabase.from('broadcast_lists').insert([{ client_id: clientId, name }]).select('*').single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ list: data });
  }

  if (req.method === 'POST' && req.body.action === 'add_contact') {
    const { listId, phone, name } = req.body;
    if (!listId || !phone) return res.status(400).json({ error: 'Missing listId or phone' });
    const cleanPhone = phone.replace(/\D/g, '');
    const { data, error } = await supabase.from('broadcast_contacts').insert([{ list_id: listId, phone: cleanPhone, full_name: name || '' }]).select('*').single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ contact: data });
  }

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

  let { clientId, leadIds, campaignText, templateName = 'alerta_promocion', isListMode = false, listId, isFreeMessage = false, mediaUrl, mediaType, aiContextUrls = [] } = req.body;

  // We will process campaignText differently depending on if it's a template or free message
  if (campaignText) {
    campaignText = campaignText.trim();
  }

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
    const selectCols = isListMode ? 'id, phone, full_name' : 'id, phone, name';
    const { data: leads, error: leadsErr } = await supabase
      .from(tableName)
      .select(selectCols)
      .in('id', leadIds);

    if (leadsErr) {
      console.error("Supabase Error leads:", leadsErr);
      return res.status(400).json({ error: 'Error DB leads: ' + leadsErr.message });
    }
    if (!leads || leads.length === 0) {
      return res.status(400).json({ error: 'No se encontraron los leads especificados.' });
    }

      // 2.5. Actualizar Contexto Visual de la IA (Producto Oculto)
      if (aiContextUrls && aiContextUrls.length > 0) {
        const { data: existingPromo } = await supabase
          .from('products')
          .select('id')
          .eq('client_id', clientId)
          .eq('name', 'PROMO_ACTUAL')
          .single();
          
        const promoData = {
          client_id: clientId,
          name: 'PROMO_ACTUAL',
          description: 'Imágenes exclusivas de la última promoción enviada por difusión al cliente.',
          price: 0,
          category: 'INTERNAL',
          active: true,
          image_url: aiContextUrls.join(',')
        };
  
        if (existingPromo) {
          await supabase.from('products').update(promoData).eq('id', existingPromo.id);
        } else {
          await supabase.from('products').insert([promoData]);
        }
      }

    let successes = 0;
    let failures = 0;
    global.firstError = null;

    // 3. Bucle de envío a Meta API (Procesamiento Secuencial con pausas)
    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      // Limpiar teléfono (solo números)
      let cleanPhone = lead.phone.replace(/\D/g, '');
      
      // Asegurar código de país (asumiendo Colombia +57 si tiene 10 dígitos)
      if (cleanPhone.length === 10) {
        cleanPhone = '57' + cleanPhone;
      }

      let payload = {};
      
      if (isFreeMessage) {
        // PAYLOAD PARA MENSAJE LIBRE
        payload = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanPhone
        };
        
        if (mediaUrl) {
          const finalType = mediaType === 'video' ? 'video' : (mediaType === 'image' ? 'image' : (mediaType === 'audio' ? 'audio' : 'document'));
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
            language: { code: req.body.templateLanguage || "es" },
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
              const lines = campaignText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
              payload.template.components.push({
                type: "body",
                parameters: lines.map(line => ({
                  type: "text",
                  text: line.replace(/[\r\n\t]+/g, ' ') // Meta strictly forbids newlines in variables
                }))
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
            // Auto-reactivate AI for this client so they can reply to the broadcast
            await supabase.from('conversations').update({ needs_human: false }).eq('client_id', clientId).eq('user_phone', cleanPhone);
            // Not updating conversations table to save DB connections & memory
          }
        } else {
          console.error(`Error enviando a ${cleanPhone}:`, data);
          failures++; 
          if (!global.firstError) global.firstError = data;
        }
      } catch (err) {
        console.error(`Network error para ${cleanPhone}:`, err);
        failures++; 
        if (!global.firstError) global.firstError = { error: err.message };
      }
      
      // Breve pausa para no asfixiar a Meta por exceso de peticiones simultáneas (Spam rate limit)
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    return res.status(200).json({ 
      success: true, 
      message: `Difusión finalizada. Enviados: ${successes}, Fallos: ${failures}`,
      stats: { successes, failures }, firstError: global.firstError
    });

  } catch (err) {
    console.error("Broadcast endpoint error:", err);
    return res.status(500).json({ error: 'Error del servidor', details: err.message });
  }
}
