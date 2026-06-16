import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data } = await supabase
    .from('products')
    .select('name, description, category')
    .eq('client_id', 'c90f532b-0b32-4614-9c21-bbf664213468')
    .ilike('name', '%lavamanos%')
    .limit(100);
    
  console.log("Total lavamanos:", data.length);
  const plateadas = data.filter(p => 
      (p.name + " " + p.description + " " + p.category).toLowerCase().includes('plateada') ||
      (p.name + " " + p.description + " " + p.category).toLowerCase().includes('cromada') ||
      (p.name + " " + p.description + " " + p.category).toLowerCase().includes('satinada') ||
      (p.name + " " + p.description + " " + p.category).toLowerCase().includes('cromo')
  );
  console.log("Lavamanos plateadas/cromadas/satinadas:");
  plateadas.forEach(p => console.log(p.name));
}
check();
