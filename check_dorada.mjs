import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data } = await supabase
    .from('products')
    .select('name, description, category')
    .eq('client_id', 'c90f532b-0b32-4614-9c21-bbf664213468')
    .ilike('category', '%griferia%');
    
  let doradas = data.filter(p => (p.name + p.description + p.category).toLowerCase().includes('dorada'));
  let oro = data.filter(p => (p.name + p.description + p.category).toLowerCase().includes('oro'));
  
  console.log("Doradas count:", doradas.length);
  console.log("Oro count:", oro.length);
  console.log("\nSome 'oro' items:");
  console.log(oro.slice(0,5).map(p => p.name));
}
check();
