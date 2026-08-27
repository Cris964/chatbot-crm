import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data: client } = await supabase.from('clients').select('id').ilike('name', '%trazzos%').single();
    if (!client) return console.log('Client not found');
    
    const { data: products } = await supabase.from('products').select('name, image_url').eq('client_id', client.id).not('image_url', 'is', null).limit(5);
    console.log(JSON.stringify(products, null, 2));
}
check();
