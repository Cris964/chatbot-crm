import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function addAssignedTo() {
  console.log("Adding assigned_to to leads...");
  const { data, error } = await supabase.rpc('execute_sql', {
    sql_query: `
      ALTER TABLE public.leads 
      ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);
    `
  });
  
  if (error) {
    console.error("Error from RPC:", error);
  } else {
    console.log("Success! RPC returned:", data);
  }
}

addAssignedTo();
