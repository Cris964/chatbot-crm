import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPrompts() {
  const { data: clients, error } = await supabase.from('clients').select('id, name, prompt');
  
  if (error) {
     console.error('Error fetching clients', error);
     return;
  }

  if (clients && clients.length > 0) {
     for (const client of clients) {
        let currentPrompt = client.prompt || '';
        
        const instruction = `
REGLA CRÍTICA PARA EL PIPELINE (CRM):
Para que el sistema CRM actualice el estado del cliente en el pipeline de ventas, DEBES incluir OBLIGATORIAMENTE un tag especial al final de tus respuestas según el nivel de interés del cliente:

- Si es la primera vez que interactúas o solo está saludando: [LEAD_STATE: Nuevo Lead | 0]
- Si el cliente te pregunta información básica pero no ha demostrado interés de compra: [LEAD_STATE: Contactado | 10]
- Si el cliente DICE explícitamente "Estoy interesado", pregunta precio, opciones de envío, o demuestra clara intención de comprar: [LEAD_STATE: Interesado | 50]
- Si están negociando el precio, método de pago, o si le estás pidiendo datos para envío: [LEAD_STATE: Negociación | 80]
- Si el cliente confirmó la compra y aceptó, NUNCA olvides el tag: [SALE_CONFIRMED: Nombre del Producto]

EJEMPLO DE RESPUESTA CUANDO ESTÁ INTERESADO:
"¡Perfecto! El producto cuesta $50.000. ¿Para qué ciudad sería el envío? [LEAD_STATE: Interesado | 50]"

Si no incluyes el tag, el sistema fallará. Usa el sentido común para avanzar al cliente de estado.`;
        
        if (!currentPrompt.includes('REGLA CRÍTICA PARA EL PIPELINE')) {
           const newPrompt = currentPrompt + '\n\n' + instruction;
           await supabase.from('clients').update({ prompt: newPrompt }).eq('id', client.id);
           console.log(`✅ Updated prompt with Pipeline Rules for client: ${client.name}`);
        } else {
           console.log(`⏭️ Prompt already contains Pipeline Rules for client: ${client.name}`);
        }
     }
  }
}

fixPrompts();
