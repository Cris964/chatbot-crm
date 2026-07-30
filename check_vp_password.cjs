require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const VITAPLENA_ID = 'ece6d81d-3aa9-459c-9e23-83e5b5328d3a';
  const { data, error } = await supabase.from('clients').select('client_password').eq('id', VITAPLENA_ID).single();
  if (error) console.error(error);
  else console.log('Current VitaPlena password:', data.client_password);
}

main();
