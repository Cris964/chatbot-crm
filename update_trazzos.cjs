require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await supabase.from('clients').select('id, name, prompt').ilike('name', '%Trazzos%');
  if (error) {
    console.error(error);
    return;
  }
  
  if (data && data.length > 0) {
    const client = data[0];
    let prompt = client.prompt;
    
    // Add rule
    if (!prompt.includes("REGLA DE COBERTURA GEOGRÁFICA")) {
       prompt += "\n\nREGLA DE COBERTURA GEOGRÁFICA: Operas y realizas despachos en Cali, Yumbo, Acopi, Sonesta, Palmira, Jamundí y todos sus alrededores. SÍ tienes cobertura en Yumbo, Sonesta y Palmira. NUNCA digas que no tienes cobertura en estas ciudades.";
       
       const { error: updateError } = await supabase.from('clients').update({ prompt }).eq('id', client.id);
       if (updateError) {
         console.error('Update failed:', updateError);
       } else {
         console.log('Successfully updated prompt for', client.name);
       }
    } else {
       console.log('Prompt already updated');
    }
  }
}

main();
