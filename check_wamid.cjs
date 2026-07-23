require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const wamid = 'wamid.HBgMNTczMTYzNzk5NzQ1FQIAEhgUM0FENjQxREZFNEZCOTg4OUFFRDQA';
  const { data, error } = await supabase.from('processed_messages').select('*').eq('id', wamid);
  if (error) console.error(error);
  else console.log('Wamid lookup:', JSON.stringify(data, null, 2));

  // Let's also check the latest conversations again just in case the timestamp in my DB is messed up
  const { data: convs } = await supabase.from('conversations').select('id, user_phone, updated_at, messages(count)').eq('client_id', 'c91119cc-5451-4a64-b0e8-6b53d33d5563');
  console.log('Activos conversations:', JSON.stringify(convs, null, 2));
}

main();
