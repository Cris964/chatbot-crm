require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: convs, error } = await supabase
    .from('conversations')
    .select('id, user_phone, messages, updated_at')
    .eq('archived', false);
    
  if (error) return console.error(error);
    
  for (const c of (convs || [])) {
    if (c.messages && c.messages.length > 0) {
      const hoursSince = (new Date().getTime() - new Date(c.updated_at).getTime()) / (1000 * 60 * 60);
      if (hoursSince > 18.5 && hoursSince < 19) {
        console.log(`\nPhone: ${c.user_phone}`);
        console.log(JSON.stringify(c.messages.slice(-3), null, 2));
      }
    }
  }
}

main();
