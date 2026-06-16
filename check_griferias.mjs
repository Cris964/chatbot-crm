import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data } = await supabase
    .from('products')
    .select('name, description, image_url')
    .eq('client_id', 'c90f532b-0b32-4614-9c21-bbf664213468')
    .ilike('name', '%griferia%lavaplatos%');

  const { data: data2 } = await supabase
    .from('products')
    .select('name, description, image_url')
    .eq('client_id', 'c90f532b-0b32-4614-9c21-bbf664213468')
    .ilike('name', '%griferia%');
  
  console.log("Lavaplatos specifically:", data?.length);
  if (data) console.log(data);

  console.log("\nAll Griferias (first 5):", data2?.length);
  if (data2) console.log(data2.slice(0, 5));
}
check();
