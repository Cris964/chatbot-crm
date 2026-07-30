require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await supabase.from('conversations').select('id, client_id, updated_at, user_phone').gt('updated_at', '2026-07-23T14:48:00Z');
  if (error) console.error(error);
  else console.log('Recent convs:', JSON.stringify(data, null, 2));
}

main();
