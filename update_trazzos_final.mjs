import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.vercel.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: clients } = await supabase.from('clients').select('id, prompt').eq('name', 'Trazzos').limit(1);
    if (!clients || clients.length === 0) return;
    
    let prompt = clients[0].prompt;

    // 1. ADD LAVAPLATOS TRAINING
    const lavaplatosTraining = `
**11. LAVAPLATOS (Acero Inoxidable Alta Resistencia):**
- Tipos de Perforación: 1 hueco (para grifería monocontrol), 3 huecos (grifería tradicional mezcladora), Sin hueco (para grifería a la pared).
- Gama Premium/Inteligente: Lavaplatos de color (Negro, Dorado, Oro Rosa) y lavaplatos inteligentes.
- Diagnóstico Obligatorio: Antes de ofrecer medidas, pregunta: "¿De qué tamaño es el módulo o mesón de su cocina?" y "¿Su grifería va a la pared o incrustada en el lavaplatos?".
- Cross-Selling: Si el cliente elige un lavaplatos de color, DEBES ofrecer obligatoriamente la grifería del mismo color. Incluye siempre accesorios de instalación (sifones, rejillas, canastillas) y pegante/sellante.
- Argumento de venta (si hay objeción de precio): "Nuestro acero inoxidable no se pigmenta y resiste impactos. Además, los diseños de submontar facilitan la limpieza al no dejar pestañas expuestas, dando una estética limpia y de alta gama."
`;
    if (!prompt.includes('11. LAVAPLATOS')) {
        prompt = prompt.replace('# CÁLCULOS TÉCNICOS Y UNIDADES', lavaplatosTraining + '\n# CÁLCULOS TÉCNICOS Y UNIDADES');
    }

    // 2. UPDATE CITAS RULE
    const citasRule = `
# AGENDAMIENTO DE CITAS Y RECORDATORIOS
- **TRAZZOS (Solo Presencial):** La cita en tienda es PRESENCIAL. Lun hasta 5:00pm, Mar-Vie hasta 5:30pm, Sáb hasta 4:00pm.
- **CREART / Trearq (Solo Virtual):** Las citas de asesoría integral o diseño de espacios son VIRTUALES por Meet. Mar-Jue 7:30-10:30 AM, Vie 2:00-5:00 PM.
- Siempre lleva al cliente a agendar una visita a la tienda o una asesoría.
- **CUANDO SE AGENDE LA CITA CON EL CLIENTE**, debes incluir EXACTAMENTE al final de tu mensaje la etiqueta [CITA_AGENDADA: YYYY-MM-DD HH:MM] con la fecha y hora acordadas (usa formato 24 horas y el año actual).
`;
    // Find the old AGENDAMIENTO section
    const citasRegex = /# AGENDAMIENTO DE CITAS Y RECORDATORIOS[\s\S]*?(?=# EXCLUSIONES DE PRODUCTO)/;
    if (citasRegex.test(prompt)) {
        prompt = prompt.replace(citasRegex, citasRule + '\n');
    }

    // 3. UPDATE MESSAGE AND PHOTOS RULES
    const strictMsgRules = `
# REGLA ESTRICTA DE FORMATO DE MENSAJE Y FOTOS (¡CRÍTICO!)
- NUNCA escribas párrafos largos o bloques de texto grandes. Debes mandar todo en mensajes súper cortos, como si fueras un humano chateando en WhatsApp.
- Cuando vayas a mostrar una foto usando [SEND_IMAGE: URL], **SOLO ENVÍA LA FOTO**. 
- NUNCA menciones el nombre completo del producto ni su referencia técnica.
- NUNCA envíes conversiones matemáticas o cálculos en el mensaje de la foto.
- Forma correcta: "¡Mira, esta opción te quedaría espectacular!" y debajo el [SEND_IMAGE: URL].
- Forma INCORRECTA: "Aquí tienes el Porcelanato Carrara 60x120cm..." -> ¡PROHIBIDO DECIR EL NOMBRE!
`;
    if (!prompt.includes('REGLA ESTRICTA DE FORMATO DE MENSAJE Y FOTOS')) {
        prompt = prompt.replace('# REGLA ESTRICTA DE COLORES', strictMsgRules + '\n# REGLA ESTRICTA DE COLORES');
    }

    await supabase.from('clients').update({ prompt }).eq('id', clients[0].id);
    console.log('✅ Final prompt updates applied (Lavaplatos, Citas, Formatting).');
}
run();
