require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: convs, error } = await supabase
    .from('conversations')
    .select('user_phone, user_name, updated_at, messages')
    .ilike('user_name', '%Mary%');
    
  if (error) return console.error(error);
  
  for (const c of convs) {
    console.log(`Name: ${c.user_name}, Phone: ${c.user_phone}, Updated: ${c.updated_at}`);
    if (c.messages) {
      console.log(JSON.stringify(c.messages.slice(-3), null, 2));
    }
  }
}

main();
