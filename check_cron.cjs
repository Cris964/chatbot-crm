require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: convs, error } = await supabase
    .from('conversations')
    .select('id, user_phone, messages, updated_at')
    .eq('archived', false);
    
  if (error) {
    console.error(error);
    return;
  }
    
  for (const c of (convs || [])) {
    if (c.messages && c.messages.length > 0) {
      let consecutiveAgents = 0;
      for (let i = c.messages.length - 1; i >= 0; i--) {
        if (c.messages[i].role === 'agent' || c.messages[i].role === 'assistant') consecutiveAgents++;
        else break;
      }
      const hoursSince = (new Date().getTime() - new Date(c.updated_at).getTime()) / (1000 * 60 * 60);
      console.log(`Phone: ${c.user_phone}, Hours: ${hoursSince.toFixed(1)}, Consecutive: ${consecutiveAgents}`);
    }
  }
}

main();
