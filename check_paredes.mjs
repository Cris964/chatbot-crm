import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data } = await supabase
    .from('products')
    .select('name, description, category')
    .eq('client_id', 'c90f532b-0b32-4614-9c21-bbf664213468')
    .or('name.ilike.%pared%,description.ilike.%pared%,category.ilike.%pared%')
    .limit(10);
    
  console.log("Products matching 'pared':");
  console.log(data);
}
check();
