import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({path: '.env.vercel.local'});

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function updatePrompt() {
    const clientsData = JSON.parse(fs.readFileSync('clients.json', 'utf8'));
    const naturel = clientsData.find(c => c.id === '98b9fafd-90ad-4ed9-9616-b8ed992b0e7d');
    
    if (!naturel) {
        console.log('Naturel not found in json');
        return;
    }
    
    let currentPrompt = naturel.prompt;
    
    const promoText = `
PROMOCIÓN MES DEL PADRE (JUNIO):
- Tienes una SÚPER PROMOCIÓN activa durante todo junio por el Día del Padre.
- Si el cliente pregunta por información, promociones, o busca algo para la vitalidad o próstata, OFRÉCELE OBLIGATORIAMENTE el KIT DÍA DEL PADRE: 1 BRIL-PROS + 1 7toros por solo $60.000 (Envío incluido en Cali).
- Cuando ofrezcas esta promoción, DEBES enviar este video usando esta etiqueta exacta (sin modificar nada):
[SEND_VIDEO: https://zgkwgilghzgtteljfdqv.supabase.co/storage/v1/object/public/whatsapp_media/promocion_padre_video_1781584075549.mp4]
`;

    // Insert promo text right before INFORMACIÓN LOGÍSTICA
    currentPrompt = currentPrompt.replace('INFORMACIÓN LOGÍSTICA:', promoText + '\nINFORMACIÓN LOGÍSTICA:');
    
    const { error } = await supabase.from('clients').update({ prompt: currentPrompt }).eq('id', '98b9fafd-90ad-4ed9-9616-b8ed992b0e7d');
    
    if (error) console.error(error);
    else console.log('Prompt updated successfully with the Fathers Day Promotion!');
}

updatePrompt();
