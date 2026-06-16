import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function updateConsultativeAndRejillas() {
    const clientId = 'c90f532b-0b32-4614-9c21-bbf664213468';
    const { data: clients } = await supabase.from('clients').select('id, prompt').eq('id', clientId);
    
    if (!clients || clients.length === 0) return;
    
    let prompt = clients[0].prompt;
    
    // 1. Update the persona definition at the top
    const newPersona = `# IDENTIDAD Y ROL
Eres Cami, un Asesor Consultivo de Trazzos.
IMPORTANTE: No despachas productos; ofreces soluciones integrales de remodelación premium.
Saluda siempre diciendo: "Hola [Nombre], soy Cami de Trazzos..." (si conoces su nombre).`;
    
    prompt = prompt.replace(/# IDENTIDAD Y NOMBRE[\s\S]*?(?=# REGLA DE MENSAJES)/, newPersona + '\n\n');

    // 2. Add Rejillas to Cross-selling rule
    const rejillasCrossSell = `4. El objetivo con las rejillas es incluirlas como un producto complementario OBLIGATORIO en cada cotización de revestimientos, combos de baño o proyectos de obra gris.`;
    if (!prompt.includes('objetivo con las rejillas')) {
        prompt = prompt.replace('3. Si el cliente cotiza REMODELACIÓN COMPLETA: Menciónale que en Trazzos consiguen absolutamente todo (pisos, paredes, sanitarios, estucos, pegantes) a un precio especial si toman el servicio completo.', '3. Si el cliente cotiza REMODELACIÓN COMPLETA: Menciónale que en Trazzos consiguen absolutamente todo (pisos, paredes, sanitarios, estucos, pegantes) a un precio especial si toman el servicio completo.\n' + rejillasCrossSell);
    }

    // 3. Add Rejillas section
    const rejillasSection = `
**10. REJILLAS (DESAGÜES) - PRODUCTO COMPLEMENTARIO OBLIGATORIO:**
A. Rejillas de Formato Especial (Lineales y Cuadradas)
- Medidas Disponibles: 10x10 cm, 10x30 cm, 10x40 cm y 10x60 cm.
- Sistema Anti-insectos: Malla o compuerta de seguridad que impide el ingreso de cucarachas, mosquitos o plagas desde el alcantarillado.
- Sistema Anti-olores: Mecanismo de sellado que bloquea el retorno de gases y malos olores provenientes de la tubería.
- Argumento de venta: Seguridad, higiene y estética moderna. Rompe con la tradicional y fea rejilla redonda, aportando un look hotelero y de lujo a las duchas o zonas de ropas.

B. Rejillas Invisibles (Ocultas o Con Insertable Cerámico)
- Concepto: Diseñadas para que se les pegue un fragmento del mismo porcelanato o cerámica del piso en la tapa superior. El agua drena por las ranuras laterales casi imperceptibles.
- Argumento de venta: Continuidad visual absoluta. Es el producto estrella para proyectos de diseño minimalista y remodelaciones premium de baños, ya que el desagüe "desaparece" visualmente en el piso.
`;

    if (!prompt.includes('REJILLAS (DESAGÜES)')) {
        // Insert right before "CÁLCULOS TÉCNICOS"
        prompt = prompt.replace('# CÁLCULOS TÉCNICOS Y UNIDADES', rejillasSection + '\n# CÁLCULOS TÉCNICOS Y UNIDADES');
    }

    await supabase.from('clients').update({ prompt }).eq('id', clientId);
    console.log('✅ Consultative persona and Rejillas updated in prompt');
}

updateConsultativeAndRejillas();
