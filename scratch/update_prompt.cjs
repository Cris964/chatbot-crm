const { createClient } = require('@supabase/supabase-js'); 
require('dotenv').config(); 
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); 

async function run() { 
  const { data } = await supabase.from('clients').select('prompt').ilike('name', '%samaritana%').single(); 
  
  let newPrompt = data.prompt.replace(
    '3. FAROL LISO (10 x 20 x 30 cm)', 
    '3. FAROL 6 HUECOS LISO (10 x 20 x 30 cm) (IMPORTANTE: El "Farol 6 huecos" es una categoría que agrupa al Liso y al Rayado. Si el cliente pide farol 6 huecos sin especificar, pregúntale cuál de los dos prefiere)'
  ); 
  
  newPrompt = newPrompt.replace(
    '4. FAROL RAYADO (10 x 20 x 30 cm)', 
    '4. FAROL 6 HUECOS RAYADO (10 x 20 x 30 cm)'
  ); 
  
  newPrompt = newPrompt.replace(
    'Una vez el cliente te haya dado el teléfono (que es el último dato)', 
    'Una vez el cliente te haya dado la fecha de inicio de obra (que es el 5to y último dato)'
  ); 
  
  await supabase.from('clients').update({ prompt: newPrompt }).ilike('name', '%samaritana%'); 
  console.log('Prompt updated successfully'); 
} 
run();
