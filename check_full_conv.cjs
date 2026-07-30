require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await supabase.from('conversations').select('*').eq('id', 'e200dccc-f682-4414-924b-242768f9312a');
  if (error) console.error(error);
  else console.log('Activos full conv:', JSON.stringify(data, null, 2));
}

main();
