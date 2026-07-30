require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await supabase.from('products').select('name').eq('client_id', 'c91119cc-5451-4a64-b0e8-6b53d33d5563').limit(5);
  if (error) console.error(error);
  else console.log('Products:', JSON.stringify(data, null, 2));
}

main();
