import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function alterTable() {
  const { error } = await supabase.rpc('run_sql', {
     sql_query: 'ALTER TABLE team_members ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT \'{"view_inbox": true}\'::jsonb;'
  });

  if (error && error.message.includes('function "run_sql" does not exist')) {
     console.log("No run_sql RPC, attempting fallback using raw rest query or another method...");
     // Supabase doesn't allow raw DDL from JS client without RPC. Let's try to do it by inserting a row with a dummy jsonb to let the REST API infer, but that's not how Postgres works.
     // Alternatively, we can use the `pg` driver if we have the postgres connection string. Let's check env vars.
     console.log(process.env.DATABASE_URL ? "Has DATABASE_URL" : "No DATABASE_URL");
  } else if (error) {
     console.error("RPC Error:", error);
  } else {
     console.log("Column added via RPC.");
  }
}

alterTable();
