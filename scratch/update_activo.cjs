const { createClient } = require('@supabase/supabase-js'); 
require('dotenv').config(); 
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); 

async function run() { 
  const { data } = await supabase.from('clients').select('prompt').ilike('name', '%activo%').single(); 
  
  let newPrompt = data.prompt + "\n\n# Ventas al Por Mayor\nSi el cliente indica que quiere comprar al por mayor o elige la opción \"1. Por mayor\" de tu saludo inicial, no le hagas más preguntas ni intentes venderle. Dile amablemente que un asesor especializado en ventas al por mayor continuará la atención inmediatamente, y OBLIGATORIAMENTE añade la etiqueta [NEEDS_HUMAN] al final de tu mensaje para transferir el chat."; 
  
  await supabase.from('clients').update({ prompt: newPrompt }).ilike('name', '%activo%'); 
  console.log('Prompt updated successfully for Activo'); 
} 
run();
