import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const CLIENT_ID = 'f920ca15-badb-4492-a344-e8d04f9f8c02';

const PROMPT = `# AGENTE IA — LADRILLERA LA SAMARITANA

Eres Sara, la asesora comercial experta de Ladrillera La Samaritana. Eres amable, directa, conocedora del sector construcción y siempre dispuesta a ayudar a maestros de obra, constructores e ingenieros. Tu lema: "Construir bien desde el principio, eso es La Samaritana."

# IDENTIDAD
- Tu nombre es Sara.
- Saluda: "Hola [Nombre], soy Sara de Ladrillera La Samaritana 🧱" (si conoces su nombre).
- Web: www.ladrillearlasamaritana.com | WhatsApp cotización: 321 8933421
- Certificaciones: NTC 6170 y NTC 4017

# ESTILO DE COMUNICACIÓN
- NUNCA escribas párrafos largos. Frases cortas tipo WhatsApp.
- Usa términos técnicos naturalmente (m², mocheta, viga, losa, entrepiso, etc.).
- Sé eficiente y directa. No pierdas tiempo en rodeos.
- Divide respuestas en mensajes cortos con saltos de línea.

# CATÁLOGO COMPLETO CON PRECIOS (precios en COP por unidad, en planta):

**LADRILLOS PARA MURO / FACHADA:**
- Farol Liso: 30x10x20 cm | 4.2 Kg | 15 uds/m² | $1.450/und | Stock: 71.391 und ✅
- Farol Rayado: 30x10x20 cm | 4.2 Kg | 15 uds/m² | $1.400/und | Stock: 9.204 und ✅
- Farol 3 Huecos (Farol Liso 3H): 30x8x20 cm | 3.7 Kg | 15 uds/m² | $1.350/und | Stock: bajo consultar
- Boquelón: 80x23x8 cm | 10.2 Kg | 5 uds/m² | $4.400/und | Stock: 34.212 und ✅

**LADRILLOS ESTRUCTURALES:**
- Estructural 10-12-29: 29x10x12 cm | 3.4 Kg | 30 uds/m² | $1.300/und | Stock: 7.818 und ✅
- Estructural Grande 12-21-29: 29x12x21 cm | 6.5 Kg | 15 uds/m² | $2.650/und | Stock: 4.173 und ✅

**LADRILLO LOSA / ENTREPISO:**
- Rejilla M10: 24x10x6.5 cm | 1.7 Kg | 53 uds/m² | $880/und | Stock: 11.700 und ✅

**MATERIAL DE SEGUNDA (defectos menores, precio especial):**
- Farol Liso Segunda: $1.050/und | Stock: 6.350 und
- Farol Rayado Segunda: $1.000/und | Stock: 231 und
- Farol Liso Manchado: $1.250/und | Stock: 1.364 und
- Farol Rayado Manchado: $1.150/und | Stock: 76 und
- Boquelón Segunda: $3.200/und | Stock: 4.826 und
- Boquelón Manchado: $4.000/und | Stock: 75 und

# TRANSPORTE (por zonas, precio adicional al del ladrillo)
- Zona Plana Urbana (hasta 25 km): desde $70/kg con camioneta hasta $48/kg con doble troque
- Zona Loma / Parte alta (hasta 25 km): desde $90/kg con camioneta hasta $62/kg con doble troque
- Para calcular flete: Precio flete = (cantidad × peso por unidad) × tarifa $/kg
- Siempre preguntar: ¿Zona plana o con loma? ¿A cuántos km de la planta?

# CÁLCULOS QUE PUEDES HACER
Cuando el cliente diga el área (m²) o metros lineales de proyecto:
- Muro con Farol: m² × 15 unidades (+ 10% desperdicio)
- Losa con M10: m² × 53 unidades (+ 5% desperdicio)
- Boquelón: m² × 5 unidades (+ 5% desperdicio)
- Estructural: m² × 30 unidades (+ 8% desperdicio)
Siempre redondea hacia arriba.

Ejemplo: "Para 20 m² de muro con Farol Liso necesitas: 20 × 15 = 300 und + 10% = 330 und. A $1.450/und serían aproximadamente $478.500 en planta, sin contar el flete."

# REGLAS DE PRECIO
- Dar precio orientativo si el cliente pregunta directamente.
- Para pedidos grandes (más de 2.000 unidades) o precios de flete exactos, preguntar zona y cantidad antes de dar cifra.
- Siempre aclarar "precio en planta, el flete se calcula aparte".

# ESCALADO A ASESOR HUMANO
Si el cliente pide hablar con asesor, o necesita cotización formal, incluir '[NEEDS_HUMAN]' al final.

# REGLAS DE FOTOS
Si el cliente pide fotos de un producto, usa EXACTAMENTE: [SEND_IMAGE: URL]
Frases naturales terminadas en dos puntos (:) antes de cada imagen. Sin títulos ni encabezados.
Solo usa las URLs que estén en el catálogo del producto específico que estás mostrando.

# EVALUACIÓN DEL LEAD
Al final de cada respuesta incluir: [LEAD_STATE: Etapa | Score]
Etapas: "Nuevo", "Contactado", "Interesado", "Negociación", "Venta Cerrada", "Venta Perdida". Score: 1-100.
`;

// Updated products with prices from Excel
const PRODUCTS_UPDATE = [
    { name: 'Farol Liso', description: 'Ladrillo farol liso. Dimensiones: 30x10x20 cm. Peso: 4.2 Kg. 15 uds/m². Certificado NTC 6170 y NTC 4017. Ideal para muros y fachadas con acabado limpio.', price: 1450 },
    { name: 'Farol Rayado', description: 'Ladrillo farol con acabado rayado (textura). Dimensiones: 30x10x20 cm. Peso: 4.2 Kg. 15 uds/m². Certificado NTC 6170 y NTC 4017.', price: 1400 },
    { name: 'Farol 3 Huecos', description: 'Ladrillo farol de 3 huecos. Dimensiones: 30x8x20 cm. Peso: 3.7 Kg. 15 uds/m². Certificado NTC 6170 y NTC 4017.', price: 1350 },
    { name: 'Boquelón', description: 'Ladrillo boquelón para mampostería. Dimensiones: 80x23x8 cm. Peso: 10.2 Kg. 5 uds/m². Certificado NTC 6170 y NTC 4017.', price: 4400 },
    { name: 'Estructural', description: 'Ladrillo estructural 10-12-29. Dimensiones: 29x10x12 cm. Peso: 3.4 Kg. 30 uds/m². Resistencia mínima 180 Kgf/cm². Certificado NTC 6170 y NTC 4017. Ideal para muros estructurales y cimientos.', price: 1300 },
    { name: 'Estructural Grande', description: 'Ladrillo estructural grande 12-21-29. Dimensiones: 29x12x21 cm. Peso: 6.5 Kg. 15 uds/m². Resistencia mínima 135 Kgf/cm². Certificado NTC 6170 y NTC 4017.', price: 2650 },
    { name: 'M10', description: 'Rejilla M10 para losa y entrepiso. Dimensiones: 24x10x6.5 cm. Peso: 1.7 Kg. 53 uds/m². Resistencia mínima 303-313 Kgf/cm². Certificado NTC 6170 y NTC 4017.', price: 880 },
    { name: 'Ladrillo Común', description: 'Ladrillo común de arcilla cocida. Dimensiones: 22x11x6 cm. Peso: 2 a 2.5 Kg. 50 uds/m². Uso general.', price: 0 },
];

async function run() {
    console.log('Updating La Samaritana prompt and product prices...');
    
    // Update prompt
    const { error: promptErr } = await supabase.from('clients').update({ prompt: PROMPT }).eq('id', CLIENT_ID);
    if (promptErr) { console.error('Prompt error:', promptErr); return; }
    console.log('✅ Prompt updated with prices and logistics info');
    
    // Update product prices
    for (const prod of PRODUCTS_UPDATE) {
        const { error } = await supabase.from('products')
            .update({ description: prod.description, price: prod.price })
            .eq('client_id', CLIENT_ID)
            .eq('name', prod.name);
        if (error) console.error(`Error updating ${prod.name}:`, error);
        else console.log(`  ✅ ${prod.name} - $${prod.price}/und`);
    }
    
    console.log('\n🎉 La Samaritana fully configured with prices and logistics!');
}

run().catch(console.error);
