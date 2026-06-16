import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase
    .from('products')
    .select('name, category, description')
    .eq('client_id', 'c90f532b-0b32-4614-9c21-bbf664213468')
    .ilike('category', '%exterior%');
  
  console.log("Exterior products found:", data?.length);
  if (data) {
    console.log(data);
  }

  const { data: data2 } = await supabase
    .from('products')
    .select('name, category, description')
    .eq('client_id', 'c90f532b-0b32-4614-9c21-bbf664213468')
    .ilike('name', '%58x118%');
  
  console.log("Products with 58x118 in name:", data2?.length);
  if (data2) {
    console.log(data2);
  }
}
check();
