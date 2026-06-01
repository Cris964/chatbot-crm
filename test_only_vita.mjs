import { createClient } from "@supabase/supabase-js";
const sb = createClient("https://zgkwgilghzgtteljfdqv.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpna3dnaWxnaHpndHRlbGpmZHF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYzNjg4NiwiZXhwIjoyMDg4MjEyODg2fQ.BZu3JO7nMQ9rVtf9kUlS9VOX_6IYgPtXqudy3zZLjS4"); 
async function test(){ 
    const {data} = await sb.from("conversations").select("*").eq("client_id", "ece6d81d-3aa9-459c-9e23-83e5b5328d3a"); 
    console.log(JSON.stringify(data, null, 2)); 
} 
test();
