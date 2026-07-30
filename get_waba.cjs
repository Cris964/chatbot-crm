require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function getWaba() {
  const { data } = await supabase.from('clients').select('whatsapp_token, phone_number_id').eq('id', 'f920ca15-badb-4492-a344-e8d04f9f8c02').single();
  
  const res = await fetch(`https://graph.facebook.com/v21.0/${data.phone_number_id}?fields=whatsapp_business_account&access_token=${data.whatsapp_token}`);
  const result = await res.json();
  console.log("Graph API:", result);
  
  if (result.whatsapp_business_account?.id) {
     const wabaId = result.whatsapp_business_account.id;
     console.log("Fetching templates for WABA:", wabaId);
     const res2 = await fetch(`https://graph.facebook.com/v21.0/${wabaId}/message_templates?access_token=${data.whatsapp_token}`);
     const result2 = await res2.json();
     console.log("Templates:");
     (result2.data || []).forEach(t => console.log(t.name, t.status));
  }
}
getWaba();
