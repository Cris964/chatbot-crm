import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addLavaplatosRules() {
    const clientId = 'c90f532b-0b32-4614-9c21-bbf664213468';
    const { data: clients } = await supabase.from('clients').select('id, prompt').eq('id', clientId);
    
    if (!clients || clients.length === 0) return;
    
    let prompt = clients[0].prompt;
    
    const lavaplatosSection = `
**11. LAVAPLATOS (ACERO INOXIDABLE):**
Todos nuestros lavaplatos están fabricados en Acero Inoxidable de alta resistencia (no se pigmentan y resisten impactos).
*Diagnóstico Obligatorio ANTES de dar precio:*
1. ¿De qué tamaño es el módulo o mesón de su cocina?
2. ¿Su grifería va a la pared o al lavaplatos?

*Tipos de perforación para la grifería:*
- 1 hueco: Para griferías modernas tipo monocontrol.
- 3 huecos: Para griferías tradicionales tipo mezcladora.
- Sin hueco: Para grifería directa a la pared o incrustada en el mesón (diseño limpio y minimalista).

*Línea Premium:*
Para proyectos premium, OFRECE SIEMPRE:
- Lavaplatos de Color: Acabados de lujo en Negro, Oro Rosa y Dorado.
- Lavaplatos Inteligentes: Tecnología y accesorios avanzados, disponibles en Negro, Dorado y Oro Rosa.
- Argumento de valor (submontar): Facilitan la limpieza del mesón al no dejar pestañas expuestas, logrando una estética limpia y de alta gama.
`;

    if (!prompt.includes('**11. LAVAPLATOS (ACERO INOXIDABLE):**')) {
        prompt = prompt.replace('# CÁLCULOS TÉCNICOS Y UNIDADES', lavaplatosSection + '\n# CÁLCULOS TÉCNICOS Y UNIDADES');
    }

    const lavaplatosCrossSell = `\n5. Si el cliente cotiza LAVAPLATOS: Ofrécele INMEDIATAMENTE la **Grifería** (Si es un lavaplatos premium Negro/Dorado/Oro Rosa, ofrécele OBLIGATORIAMENTE la grifería del mismo color para armonía estética). También debes ofrecer los accesorios de instalación (rejillas, sifones, canastillas y pegante/sellante).`;
    
    if (!prompt.includes('Si el cliente cotiza LAVAPLATOS: Ofrécele INMEDIATAMENTE la **Grifería**')) {
        prompt = prompt.replace('o proyectos de obra gris.', 'o proyectos de obra gris.' + lavaplatosCrossSell);
    }

    await supabase.from('clients').update({ prompt }).eq('id', clientId);
    console.log('✅ Lavaplatos rules applied successfully');
}

addLavaplatosRules();
