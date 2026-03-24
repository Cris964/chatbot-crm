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
    
    // Supabase webhook wrapper validation
    if (!payload || !payload.record) {
      return res.status(400).json({ error: 'Invalid Supabase webhook payload' });
    }

    const record = payload.record;
    
    // The recipient phone. The frontend added `phone` and `user_phone`
    const phone = record.phone || record.user_phone;
    const message = record.message;

    if (!phone || !message) {
      return res.status(400).json({ error: 'Missing phone or message in record' });
    }

    // Load WhatsApp credentials from Vercel Environment Variables
    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
    const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
      console.error('Missing WHATSAPP_TOKEN or PHONE_NUMBER_ID in Vercel environment');
      return res.status(500).json({ error: 'Server misconfiguration: missing WhatsApp credentials' });
    }

    // Format Meta Graph API request
    const metaUrl = `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`;
    
    console.log(`Sending message to ${phone} via Meta API...`);

    const metaResponse = await fetch(metaUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone,
        type: 'text',
        text: {
          preview_url: false,
          body: message
        }
      })
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

    // Consider success, return 200 to acknowledge webhook
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
