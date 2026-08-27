import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkPolicies() {
    // Try to execute a raw HTTP request to the REST endpoint
    const url = `${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/run_sql_query`;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: "SELECT polname, pg_get_expr(polwithcheck, polrelid) as policy_check, pg_get_expr(polqual, polrelid) as policy_qual FROM pg_policy WHERE polname ILIKE '%insert%'" })
    });
    console.log(await res.json());
}
checkPolicies();
