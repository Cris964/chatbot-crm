require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testTemplate() {
  const { data } = await supabase.from('clients').select('whatsapp_token, phone_number_id').eq('id', 'f920ca15-badb-4492-a344-e8d04f9f8c02').single();
  const WHATSAPP_TOKEN = data.whatsapp_token;
  const PHONE_NUMBER_ID = data.phone_number_id;
  const phone = '573163799745';
  
  const metaUrl = `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`;
  const metaPayload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone,
    type: 'template',
    template: { name: 'hello_world', language: { code: 'es' } }
  };

  const res = await fetch(metaUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metaPayload)
  });

  const resData = await res.json();
  console.log("Status:", res.status);
  console.log(JSON.stringify(resData, null, 2));
}

testTemplate();
