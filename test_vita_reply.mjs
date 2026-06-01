import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://zgkwgilghzgtteljfdqv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpna3dnaWxnaHpndHRlbGpmZHF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYzNjg4NiwiZXhwIjoyMDg4MjEyODg2fQ.BZu3JO7nMQ9rVtf9kUlS9VOX_6IYgPtXqudy3zZLjS4';

const sb = createClient(supabaseUrl, supabaseKey);

async function test(){ 
    const {data} = await sb.from("conversations").select("*"); 
    const vita = data.filter(d => d.client_id === 'ece6d81d-3aa9-459c-9e23-83e5b5328d3a' || d.user_phone === '15556397704' || d.user_phone === '+1 555 6397704' || d.user_phone === '573163799745');
    console.log(JSON.stringify(vita, null, 2)); 
} 
test();
