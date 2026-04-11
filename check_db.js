
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  const { data: clients, error: cErr } = await supabase.from('clients').select('*')
  console.log('--- CLIENTS ---')
  console.log(JSON.stringify(clients, null, 2))

  const { data: leads, error: lErr } = await supabase.from('leads').select('name, user_id, client_id').limit(10)
  console.log('--- LEADS ---')
  console.log(JSON.stringify(leads, null, 2))
}

checkData()
