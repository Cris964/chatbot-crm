import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data: client } = await supabase.from('clients').select('id').ilike('name', '%activo%').single();
    if (client) {
        const { data, error } = await supabase.from('products').select('name, category').eq('client_id', client.id).limit(20);
        console.log(JSON.stringify(data, null, 2));
    }
}

check();
