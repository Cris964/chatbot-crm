require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await supabase.from('conversations').select('*').eq('id', 'b9394421-7987-4bf3-a7e4-3571dfefa4ea');
  if (error) console.error(error);
  else console.log('VitaPlena Conv:', JSON.stringify(data[0].messages, null, 2));
}

main();
