import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function simulateSalesFetch() {
    console.log('--- Simulating Sales Fetch ---');
    const { data: salesList, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
        console.error('Fetch Error:', error.message);
    } else {
        console.log(`Fetched ${salesList.length} sales.`);
        salesList.forEach(s => {
            console.log(`- ID: ${s.id} | Product: ${s.product} | Status: ${s.status} | Client: ${s.client_id}`);
        });
    }
}

simulateSalesFetch();
