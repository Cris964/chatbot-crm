require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data } = await supabase.from('clients').select('id, name, prompt');
  data.forEach(c => {
    console.log(`\n=== CLIENT: ${c.name} (${c.id}) ===`);
    console.log(c.prompt.substring(0, 200) + "...");
  });
}

main();
