require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await supabase.from('clients').select('prompt').eq('name', 'Trazzos').single();
  if (error) console.error(error);
  else {
    const fs = require('fs');
    fs.writeFileSync('trazzos_current_prompt_temp.txt', data.prompt);
    console.log('Saved to trazzos_current_prompt_temp.txt');
  }
}

main();
