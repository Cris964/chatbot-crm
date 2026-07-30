require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const newPrompt = fs.readFileSync('samaritana_prompt.txt', 'utf8');
  
  const { error } = await supabase
    .from('clients')
    .update({ prompt: newPrompt })
    .eq('id', 'f920ca15-badb-4492-a344-e8d04f9f8c02');
    
  if (error) console.error(error);
  else console.log('Prompt successfully updated in the database.');
}
main();
