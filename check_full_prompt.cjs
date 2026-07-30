require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await supabase.from('clients').select('prompt, catalog').eq('id', 'ece6d81d-3aa9-459c-9e23-83e5b5328d3a');
  if (error) console.error(error);
  else {
    console.log('--- PROMPT ---');
    console.log(data[0].prompt);
    console.log('\n--- CATALOG ---');
    console.log(data[0].catalog);
  }
}

main();
