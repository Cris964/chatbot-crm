require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: clients } = await supabase.from('clients').select('id, name, phone_number_id, whatsapp_token').eq('id', 'c91119cc-5451-4a64-b0e8-6b53d33d5563');
  console.log('Activos Client Data:', JSON.stringify(clients, null, 2));

  // Check recent processed_messages (last 5)
  const { data: msgs } = await supabase.from('processed_messages').select('*').order('created_at', { ascending: false }).limit(10);
  console.log('Recent Webhook Locks:', JSON.stringify(msgs, null, 2));
}

main();
