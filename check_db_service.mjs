import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://zgkwgilghzgtteljfdqv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpna3dnaWxnaHpndHRlbGpmZHF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYzNjg4NiwiZXhwIjoyMDg4MjEyODg2fQ.BZu3JO7nMQ9rVtf9kUlS9VOX_6IYgPtXqudy3zZLjS4";

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  const { data: clients, error: cErr } = await supabase.from('clients').select('*')
  console.log('--- CLIENTS ---')
  console.log(clients ? clients.length : cErr)
}

checkData()
