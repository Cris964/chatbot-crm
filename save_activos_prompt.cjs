require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const newPrompt = fs.readFileSync('activos_current_prompt.txt', 'utf8');
  
  const { error } = await supabase
    .from('clients')
    .update({ prompt: newPrompt })
    .eq('id', 'c91119cc-5451-4a64-b0e8-6b53d33d5563');
    
  if (error) console.error(error);
  else console.log('Prompt successfully updated in the database.');
}
main();
