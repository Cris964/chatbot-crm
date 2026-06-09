import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function updateTrazzosPrompt() {
    console.log("Fetching Trazzos Prompt...");
    const { data: clients, error: fetchErr } = await supabase.from('clients').select('id, name, prompt').ilike('name', '%Trazzos%');
    
    if (fetchErr || !clients || clients.length === 0) {
        console.error("Error fetching Trazzos:", fetchErr);
        return;
    }

    const trazzos = clients[0];
    let prompt = trazzos.prompt;

    // Remove the Google Drive section
    const driveSectionRegex = /# ENLACE DE FOTOS Y CATÁLOGO[\s\S]*?(?:https:\/\/drive\.google\.com[^\s]*)/g;
    prompt = prompt.replace(driveSectionRegex, '');

    // Optionally, add a new instruction explicitly (though webhook.js already injects it, doing it here reinforces it)
    const newInstruction = `\n# FOTOS DE PRODUCTOS
- Si el cliente te pide fotos, catálogo o imágenes de los productos, envíalas utilizando el comando [SEND_IMAGE: URL] que te proporciona el sistema en la lista de productos disponibles. (Nunca envíes links de Google Drive).`;
    
    if (!prompt.includes('[SEND_IMAGE:')) {
        prompt += newInstruction;
    }

    console.log("Updating Trazzos Prompt...");
    const { error: updateErr } = await supabase.from('clients').update({ prompt: prompt }).eq('id', trazzos.id);
    
    if (updateErr) {
        console.error("Error updating prompt:", updateErr);
    } else {
        console.log("✅ Trazzos prompt updated successfully. Removed Drive link.");
    }
}

updateTrazzosPrompt();
