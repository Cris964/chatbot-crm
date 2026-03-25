import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkInv() {
    console.log('--- Inventory Columns ---');
    const { data } = await supabase.from('inventory').select('*').limit(1);
    if (data && data.length > 0) console.log(Object.keys(data[0]));
    
    // Also try to find a user_id from anywhere
    const tables = ['inventory', 'leads', 'clients', 'products'];
    for (const t of tables) {
       const { data } = await supabase.from(t).select('*').limit(1);
       if (data && data[0] && data[0].user_id) {
          console.log(`Found a user_id in ${t}: ${data[0].user_id}`);
       }
    }
}

checkInv();
