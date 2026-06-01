import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Try with service role key
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log("Using URL:", supabaseUrl);
console.log("Using key type:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "SERVICE_ROLE" : "ANON");

async function run() {
  // Try getting conversations with no filter
  const { data, error, count } = await supabase.from('conversations').select('*', { count: 'exact' }).limit(5);
  console.log("Error:", JSON.stringify(error));
  console.log("Count:", count);
  console.log("Data:", JSON.stringify(data));
}
run();
