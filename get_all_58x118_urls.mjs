import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data } = await supabase
    .from('products')
    .select('name, image_url')
    .eq('client_id', 'c90f532b-0b32-4614-9c21-bbf664213468')
    .ilike('name', '%58x118%')
    .limit(20);
  
  const exterior = data.filter(p => ['Acasta', 'Barroco', 'Sinai', 'Tivoli', 'Toba'].some(n => p.name.includes(n)));
  
  exterior.forEach(p => {
    console.log(`- ${p.name}:`);
    console.log(`  URL: ${p.image_url}`);
  });
}
check();
