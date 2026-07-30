require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data } = await supabase.from('clients').select('prompt').eq('id', 'f920ca15-badb-4492-a344-e8d04f9f8c02').single();
  fs.writeFileSync('samaritana_prompt.txt', data.prompt);
  console.log('Saved to samaritana_prompt.txt');
}
main();
