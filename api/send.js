import { createClient } from '@supabase/supabase-js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};


export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;
    
    // Support both direct API calls and legacy DB webhooks
    const record = payload.record || payload;
    
    const phone = record.phone || record.user_phone;
    const message = record.message;
    const clientId = record.client_id;

    if (!phone || !message || !clientId) {
      return res.status(400).json({ error: 'Missing phone, message, or client_id' });
    }

    // Initialize Supabase admin client to fetch client credentials
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase credentials in environment variables.");
      return res.status(500).json({ error: 'Server misconfiguration: missing Supabase credentials' });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the client's WhatsApp credentials from the database
    const { data: clients, error: clientErr } = await supabase
      .from('clients')
      .select('whatsapp_token, phone_number_id, facebook_access_token')
      .eq('id', clientId)
      .limit(1);

    if (clientErr || !clients || clients.length === 0) {
      return res.status(404).json({ error: 'Client not found or db error' });
    }

    const client = clients[0];
    const channel = record.channel || 'whatsapp';
    
    let metaUrl, metaPayload, headers;

    if (channel === 'whatsapp') {
        const WHATSAPP_TOKEN = client.whatsapp_token || process.env.WHATSAPP_TOKEN;
        const PHONE_NUMBER_ID = client.phone_number_id || process.env.PHONE_NUMBER_ID;

        if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
          console.error(`Missing WHATSAPP_TOKEN or PHONE_NUMBER_ID for client ${clientId}`);
          return res.status(500).json({ error: 'Client misconfiguration: missing WhatsApp credentials' });
        }

        metaUrl = `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`;
        
        metaPayload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phone,
        };

        const msgType = record.type || 'text';

        if (msgType === 'image') {
          metaPayload.type = 'image';
          metaPayload.image = { link: message };
        } else if (msgType === 'video') {
          metaPayload.type = 'video';
          metaPayload.video = { link: message };
        } else if (msgType === 'audio') {
          metaPayload.type = 'audio';
          metaPayload.audio = { link: message };
        } else if (msgType === 'document' || msgType === 'file') {
          metaPayload.type = 'document';
          metaPayload.document = { link: message };
        } else if (msgType === 'template') {
          metaPayload.type = 'template';
          metaPayload.template = { name: message.toLowerCase().trim(), language: { code: 'es' } };
          
          const components = [];
          
          if (record.mediaUrl) {
             // For simplicity, we assume image if not specified, but could be dynamic
             const mType = record.mediaType || 'image'; 
             components.push({
               type: "header",
               parameters: [
                 {
                   type: mType,
                   [mType]: { link: record.mediaUrl }
                 }
               ]
             });
          }
          
          if (record.variable) {
             components.push({
               type: "body",
               parameters: [
                 {
                   type: "text",
                   text: record.variable
                 }
               ]
             });
          }
          
          if (components.length > 0) {
             metaPayload.template.components = components;
          }
        } else {
          metaPayload.type = 'text';
          metaPayload.text = { preview_url: false, body: message };
        }

        headers = {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        };
    } else if (channel === 'messenger' || channel === 'instagram') {
        const FB_TOKEN = client.facebook_access_token;
        if (!FB_TOKEN) {
            console.error(`Missing facebook_access_token for client ${clientId}`);
            return res.status(500).json({ error: 'Client misconfiguration: missing facebook_access_token' });
        }

        metaUrl = `https://graph.facebook.com/v21.0/me/messages?access_token=${FB_TOKEN}`;
        
        metaPayload = {
            recipient: { id: phone },
            message: {}
        };
        
        const msgType = record.type || 'text';
        if (msgType === 'text') {
            metaPayload.message.text = message;
        } else if (msgType === 'image' || msgType === 'video' || msgType === 'audio' || msgType === 'document') {
            metaPayload.message.attachment = {
                type: msgType === 'document' ? 'file' : msgType,
                payload: { url: message, is_reusable: true }
            };
        }

        headers = {
          'Content-Type': 'application/json'
        };
    } else {
        return res.status(400).json({ error: `Unsupported channel: ${channel}` });
    }

    console.log(`Sending message to ${phone} via ${channel} for client ${clientId}...`);

    const metaResponse = await fetch(metaUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(metaPayload)
    });

    const metaResult = await metaResponse.json();

    if (!metaResponse.ok) {
      console.error('Meta API Error:', metaResult);
      return res.status(metaResponse.status).json({ 
        error: 'Failed to send WhatsApp message', 
        details: metaResult 
      });
    }

    console.log('Successfully sent message:', metaResult);

    return res.status(200).json({
      success: true,
      meta_message_id: metaResult.messages?.[0]?.id,
      recipient: phone
    });

  } catch (error) {
    console.error('Serverless Function Exception:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
