require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: leads } = await supabase
    .from('leads')
    .select('assigned_to')
    .eq('client_id', 'c90f532b-0b32-4614-9c21-bbf664213468');
    
  let counts = {};
  leads.forEach(l => {
    if (l.assigned_to) {
      counts[l.assigned_to] = (counts[l.assigned_to] || 0) + 1;
    }
  });
  console.log(counts);
}

main();
