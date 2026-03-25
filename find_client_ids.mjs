import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function findClientIds() {
    console.log('--- Finding Unique Client IDs in Inventory ---');
    const { data: products, error } = await supabase.from('inventory')
        .select('client_id, name')
        .limit(100);
    
    if (error) {
        console.error('Error:', error.message);
    } else {
        const ids = [...new Set(products.map(p => p.client_id))];
        console.log('Unique Client IDs found in inventory:', ids);
        
        for (const id of ids) {
           const count = products.filter(p => p.client_id === id).length;
           const sample = products.find(p => p.client_id === id).name;
           console.log(`ID: ${id} | Products Count: ${count} | Sample: ${sample}`);
        }
    }
}

findClientIds();
