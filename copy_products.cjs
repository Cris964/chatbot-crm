require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const ACTIVOS_ID = 'c91119cc-5451-4a64-b0e8-6b53d33d5563';
const VITAPLENA_ID = 'ece6d81d-3aa9-459c-9e23-83e5b5328d3a';

async function main() {
  const { data: actProducts, error: err1 } = await supabase.from('products').select('*').eq('client_id', ACTIVOS_ID);
  if (err1) return console.error(err1);

  const copiedProducts = actProducts.map(p => {
    delete p.id;
    delete p.created_at;
    p.client_id = VITAPLENA_ID;
    return p;
  });

  const { error: err2 } = await supabase.from('products').insert(copiedProducts);
  if (err2) console.error(err2);
  else console.log(`Copied ${copiedProducts.length} Activos products to VitaPlena!`);
}

main();
