require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data } = await supabase.from('clients').select('prompt').eq('id', 'c91119cc-5451-4a64-b0e8-6b53d33d5563').single();
  if (data) {
    fs.writeFileSync('activos_current_prompt.txt', data.prompt);
    console.log("Prompt saved to activos_current_prompt.txt");
  }
}
main();
