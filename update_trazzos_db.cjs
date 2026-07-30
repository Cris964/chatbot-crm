require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const newPrompt = fs.readFileSync('trazzos_current_prompt_temp.txt', 'utf8');
  const { error } = await supabase.from('clients').update({ prompt: newPrompt }).eq('name', 'Trazzos');
  if (error) console.error(error);
  else console.log('Trazzos prompt updated successfully in DB!');
}

main();
