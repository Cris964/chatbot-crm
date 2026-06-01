import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function updatePrompt() {
  const clientId = '5ac584f8-1d98-4583-9c2c-76a3c3cfe07d';
  
  const { data: clients } = await supabase.from('clients').select('id, name, prompt').eq('id', clientId);
  if (!clients || clients.length === 0) return;
  
  const currentPrompt = clients[0].prompt || '';
  
  const instruction = `
REGLA CRÍTICA PARA ENVÍO DE FOTOS:
Si el cliente te pide una foto, catálogo visual o imagen de un producto, DEBES revisar si la descripción del producto incluye un enlace de imagen con el formato [IMG: url_de_la_foto].
Si lo tiene, debes responder amablemente adjuntando OBLIGATORIAMENTE la siguiente etiqueta oculta al final de tu mensaje: [SEND_IMAGE: url_de_la_foto]
Ejemplo de respuesta tuya: "¡Claro que sí! Aquí tienes una foto del producto que me pides. [SEND_IMAGE: https://...]"
¡SOLO USA LAS FOTOS QUE ESTÉN EN EL INVENTARIO CON EL FORMATO [IMG: url]! Si un producto no tiene el texto [IMG: url] en su descripción, dile al cliente que por el momento no tienes fotos disponibles de ese producto específico.`;

  if (!currentPrompt.includes('REGLA CRÍTICA PARA ENVÍO DE FOTOS')) {
     const newPrompt = currentPrompt + '\n\n' + instruction;
     await supabase.from('clients').update({ prompt: newPrompt }).eq('id', clientId);
     console.log('✅ Updated Trazzos prompt with Image Rules');
  } else {
     console.log('✅ Trazzos prompt already has Image Rules');
  }
}

updatePrompt();
