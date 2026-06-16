import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.vercel.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: clients } = await supabase.from('clients').select('id, prompt').eq('name', 'Trazzos').limit(1);
    if (!clients || clients.length === 0) return;
    
    let prompt = clients[0].prompt;

    const newPeganteRule = `- Pegante: Por BULTOS de 25 kg. (Hasta 60x60: 1 bulto x 3.5 m². Mayor a 60x60: 1 bulto x 2.5 m²).
  * REGLA DE ORO DE LOS PEGANTES: El "Pegante Porcelánico" ES EXCLUSIVO PARA PORCELANATOS. NUNCA ofrezcas pegante porcelánico si el cliente compró cerámica. Para cerámicas debes ofrecer "Pegante Cerámico".`;

    // Reemplazar la línea de pegante antigua por la nueva
    const regex = /- Pegante: Por BULTOS de 25 kg\..*/g;
    prompt = prompt.replace(regex, newPeganteRule);

    await supabase.from('clients').update({ prompt }).eq('id', clients[0].id);
    console.log('✅ Regla de pegante actualizada en el prompt.');
}
run();
