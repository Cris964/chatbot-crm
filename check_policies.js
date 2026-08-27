import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const { data, error } = await supabase.rpc('run_sql_query', {
        query: "SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects'"
    });
    console.log(data, error);
}

main();
