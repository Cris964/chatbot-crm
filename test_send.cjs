require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testSend() {
  const clientId = 'f920ca15-badb-4492-a344-e8d04f9f8c02'; // La Samaritana
  const phone = '573163799745';
  const message = 'Test de mensaje desde el servidor';
  
  const { data: clients } = await supabase
    .from('clients')
    .select('whatsapp_token, phone_number_id')
    .eq('id', clientId)
    .single();
    
  if (!clients) return console.log("Client not found");
  
  const WHATSAPP_TOKEN = clients.whatsapp_token || process.env.WHATSAPP_TOKEN;
  const PHONE_NUMBER_ID = clients.phone_number_id || process.env.PHONE_NUMBER_ID;
  
  const metaUrl = `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`;
  const metaPayload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone,
    type: 'text',
    text: { preview_url: false, body: message }
  };
  
  console.log("Sending to Meta...");
  const res = await fetch(metaUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metaPayload)
  });
  
  const data = await res.json();
  console.log("Meta Response:", data);
}

testSend();
