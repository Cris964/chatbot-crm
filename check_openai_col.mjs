import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    const { data, error } = await supabase.rpc('get_clients_schema'); // This won't work, we need a standard pg query but we don't have db connection string.
    
    // Instead we can just do an introspection query via postgrest if openapi is available, 
    // or try to select openai_key and see if it fails.
    const { error: e } = await supabase.from('clients').select('openai_key').limit(1);
    console.log("Error querying openai_key:", e);
}
check();
