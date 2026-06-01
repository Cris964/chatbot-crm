import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updatePrompt() {
  const { data: clients } = await supabase.from('clients').select('id, name, prompt');
  
  if (clients && clients.length > 0) {
     for (const client of clients) {
        let currentPrompt = client.prompt || '';
        const instruction = "El sistema transcribe las notas de voz del cliente a texto para ti. Responde con naturalidad a lo que el cliente te diga en los audios y NUNCA le digas que no puedes escuchar notas de voz u audios.";
        
        if (!currentPrompt.includes(instruction)) {
           const newPrompt = currentPrompt + '\n\n' + instruction;
           await supabase.from('clients').update({ prompt: newPrompt }).eq('id', client.id);
           console.log(`Updated prompt for client: ${client.name}`);
        } else {
           console.log(`Prompt already contains instruction for client: ${client.name}`);
        }
     }
  }
}

updatePrompt();
