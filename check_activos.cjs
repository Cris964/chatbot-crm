require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: p } = await supabase.from('products').select('id').eq('client_id', 'c91119cc-5451-4a64-b0e8-6b53d33d5563');
  const { data: c } = await supabase.from('clients').select('prompt').eq('id', 'c91119cc-5451-4a64-b0e8-6b53d33d5563');
  console.log('Products count:', p ? p.length : 0);
  console.log('Prompt:', c ? c[0].prompt : null);
}

main();
