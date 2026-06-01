import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    // Note: Supabase JS client doesn't directly support executing raw SQL DDL through the regular query interface.
    // We would need to use RPC or the user has to run it.
    // Let's check if we can query the publication to see if it's there.
    const { data, error } = await supabase.from('pg_publication_tables').select('*').eq('pubname', 'supabase_realtime');
    console.log("Realtime tables:", data);
    console.log("Error:", error);
}
run();
