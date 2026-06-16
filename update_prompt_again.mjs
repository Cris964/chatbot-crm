import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: client } = await supabase.from('clients').select('id, prompt').ilike('name', '%Samaritana%').single();
    let prompt = client.prompt;
    prompt += `\n\n# LECTURA DE IMÁGENES\n¡IMPORTANTE! Si el cliente te envía una foto de un ladrillo, SÍ puedes verla. Intenta deducir qué tipo de ladrillo es (farol, estructural, bloquelón) basándote en la forma y los huecos. Si no estás segura, haz una suposición educada y dile al cliente "Parece que es un ladrillo tipo X, ¿es correcto? ¿Qué medidas buscas?". NUNCA digas que no puedes identificar imágenes o que no puedes ver fotos. ¡Eres experta visualizando materiales!`;
    
    await supabase.from('clients').update({ prompt }).eq('id', client.id);
    console.log("Prompt actualizado!");
}
run();
