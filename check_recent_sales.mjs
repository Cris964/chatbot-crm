import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkRecentSales() {
    console.log('--- Detailed Sales Check ---');
    const { data: sales, error } = await supabase
      .from('orders')
      .select('id, product, created_at, user_phone')
      .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log(`Found ${sales.length} sales.`);
        sales.forEach(s => {
            console.log(`- ${s.id} | ${s.product} | ${s.created_at} | ${s.user_phone}`);
        });
    }
}

checkRecentSales();
