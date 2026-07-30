require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const ACTIVOS_ID = 'c91119cc-5451-4a64-b0e8-6b53d33d5563';
const VITAPLENA_ID = 'ece6d81d-3aa9-459c-9e23-83e5b5328d3a';

async function main() {
  // 1. Fetch VitaPlena current config to back it up
  const { data: vpData, error: vpErr } = await supabase.from('clients').select('prompt, catalog, name').eq('id', VITAPLENA_ID).single();
  if (vpErr) return console.error('Error fetching VitaPlena:', vpErr);
  
  fs.writeFileSync('vitaplena_backup.json', JSON.stringify(vpData, null, 2));
  console.log('Backed up VitaPlena config to vitaplena_backup.json');

  // 2. Fetch Activos config
  const { data: actData, error: actErr } = await supabase.from('clients').select('prompt, catalog').eq('id', ACTIVOS_ID).single();
  if (actErr) return console.error('Error fetching Activos:', actErr);

  // 3. Overwrite VitaPlena config with Activos config
  const { error: updateErr } = await supabase.from('clients').update({
    prompt: actData.prompt,
    catalog: actData.catalog
  }).eq('id', VITAPLENA_ID);

  if (updateErr) console.error('Error updating VitaPlena:', updateErr);
  else console.log('Successfully copied Activos config to VitaPlena!');
}

main();
