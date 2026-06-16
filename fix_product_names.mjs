import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: prods } = await supabase
    .from('products')
    .select('id, name')
    .eq('client_id', 'c90f532b-0b32-4614-9c21-bbf664213468')
    .ilike('name', '%58x118%');
  
  if (prods) {
    for (const p of prods) {
      let cleanName = p.name;
      // Remove weird prefixes
      cleanName = cleanName.replace(/Formato 58x118 Piso de (Exterior|Interior)( Acabado (Mate|Brillante))? /i, '');
      // Remove extensions and trailing words
      cleanName = cleanName.replace(/\.(webp|jpg|png|jpeg).*$/i, '');
      // Remove trailing periods
      cleanName = cleanName.replace(/\.$/, '').trim();
      
      console.log(`Renaming: "${p.name}" -> "${cleanName}"`);
      await supabase.from('products').update({ name: cleanName }).eq('id', p.id);
    }
    console.log("Renaming complete.");
  }
}
check();
