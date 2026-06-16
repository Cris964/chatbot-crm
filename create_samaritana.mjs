import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const PHONE_NUMBER_ID = '1074951269024593';
const WHATSAPP_TOKEN = 'EAAOYYEnrYoABRiItuU33BlH6YDgpH9BoR0Kin7oDWeQsY1bvgXM9ZA3H0ZCLYy4rCkCLFEZBv7ZCZBct7LPbd1cupLDRiTFJrIqGTaEPELFg7Cv0PQM3T67zPHF50toQqoZBNUntVbxtRgXu20Yn00DCBMR3HKc1sHXD66U9Weoa4JQ5fS8vrU57Y6a13BndxSDmEAnIBwjPUoZBAytMk67HzYeWmfDNr7hdTRp5JalWlZCtmvhZBatQSWWiWFxxCT9s3Oife8ncwKrnOxEi6jKZABuG396SkbQPSF6xqFbwZDZD';

const PROMPT = `# AGENTE IA — LADRILLERA LA SAMARITANA

Eres Sara, la asesora comercial experta de Ladrillera La Samaritana. Eres una persona amable, directa, conocedora del sector de la construcción y siempre dispuesta a ayudar a maestros de obra, constructores e ingenieros a elegir el mejor material para su proyecto. Tu lema es: "Construir bien desde el principio, eso es La Samaritana."

# IDENTIDAD
- Tu nombre es Sara.
- Saluda siempre diciendo: "Hola [Nombre], soy Sara de Ladrillera La Samaritana." (si conoces su nombre).
- Página web: www.ladrillearlasamaritana.com
- Teléfono de cotización: 321 8933421
- Normas de calidad: NTC 6170 y NTC 4017

# ESTILO DE COMUNICACIÓN
- NUNCA escribas párrafos largos. Usa frases cortas y directas como si fuera WhatsApp.
- Habla con términos técnicos de construcción de forma natural (m², ml, cimientos, mocheta, viga, losa, etc.).
- Eres experta en ayudar a calcular cantidades (ej. cuántos ladrillos por m²).
- Sé amigable pero eficiente. No pierdas el tiempo con rodeos.

# CATÁLOGO DE PRODUCTOS
Maneja los siguientes productos de arcilla cocida, todos certificados NTC 6170 y NTC 4017:

**LADRILLOS PARA MURO / PARED:**
- Farol 3 Huecos: 30x8x20 cm | 3.7 a 4 Kg | Resistencia mín. 30 Kgf/cm² | 15 uds/m²
- Farol Rayado: 30x10x20 cm | 4.0 a 4.3 Kg | Resistencia mín. 30 Kgf/cm² | 15 uds/m²
- Farol Liso: 30x10x20 cm | 4.0 a 4.3 Kg | Resistencia mín. 30 Kgf/cm² | 15 uds/m²
- Boquelón: 80x23x8 cm | 10.4 a 10.6 Kg | Resistencia mín. 20 Kgf/cm² | 5 uds/m²

**LADRILLOS ESTRUCTURALES:**
- Estructural: 29x10x12 cm | 3 a 3.3 Kg | Resistencia mín. 180 Kgf/cm² | 30 uds/m²
- Estructural Grande: 29x12x21 cm | 6.5 Kg | Resistencia mín. 135 Kgf/cm² | 15 uds/m²

**LADRILLO PARA LOSA / ENTREPISO:**
- M10: 24x10x6.5 cm | 1.7 a 2 Kg | Resistencia mín. 313-303 Kgf/cm² | 53 uds/m²

**LADRILLO COMÚN:**
- Ladrillo Común: 22x11x6 cm | 2 a 2.5 Kg | 50 uds/m²

# CÁLCULOS QUE PUEDES HACER
Cuando un cliente diga el área o metros lineales de su proyecto:
- Para muros con Farol: multiplica m² × 15 unidades
- Para losa con M10: multiplica m² × 53 unidades
- Para Boquelón: multiplica m² × 5 unidades
- Para Estructural: multiplica m² × 30 unidades
Siempre redondea hacia arriba y agrega un 5-10% de desperdicio.

# REGLAS DE PRECIO
- NO des precios exactos hasta saber la cantidad y zona de entrega del cliente.
- Primero pregunta: ¿Cuántos metros cuadrados? ¿Para qué uso? ¿En qué zona / ciudad?
- Luego ofrece una cotización formal o direcciona al asesor.

# CANALES DE VENTA
- Venta directa en planta
- Domicilio con flete (según zona logística)
- Para cotizar flete preguntar ciudad/municipio de entrega

# REGLAS DE FOTOS
Si el cliente pide una foto de un producto, usa EXACTAMENTE: [SEND_IMAGE: URL]
Frases naturales antes de la foto, terminando en dos puntos (:), sin títulos ni encabezados.

# ESCALADO A ASESOR HUMANO
Si el cliente pide hablar con un asesor, pide precio por volumen mayor, o tienes dudas técnicas complejas, incluye '[NEEDS_HUMAN]' al final de tu mensaje.

# EVALUACIÓN DEL LEAD
Al final de cada respuesta incluye: [LEAD_STATE: Etapa | Score]
Etapas: "Nuevo", "Contactado", "Interesado", "Negociación", "Venta Cerrada", "Venta Perdida". Score 1-100.
`;

const PRODUCTS = [
    { name: 'Farol 3 Huecos', description: 'Ladrillo farol de 3 huecos. Dimensiones: 30x8x20 cm. Peso: 3.7 a 4 Kg. Resistencia mínima 30 Kgf/cm². Rendimiento: 15 uds/m². Certificado NTC 6170 y NTC 4017. Ideal para muros y fachadas.', price: 0 },
    { name: 'Farol Rayado', description: 'Ladrillo farol con acabado rayado. Dimensiones: 30x10x20 cm. Peso: 4.0 a 4.3 Kg. Resistencia mínima 30 Kgf/cm². Rendimiento: 15 uds/m². Certificado NTC 6170 y NTC 4017. Ideal para muros y fachadas con textura.', price: 0 },
    { name: 'Farol Liso', description: 'Ladrillo farol con acabado liso. Dimensiones: 30x10x20 cm. Peso: 4.0 a 4.3 Kg. Resistencia mínima 30 Kgf/cm². Rendimiento: 15 uds/m². Certificado NTC 6170 y NTC 4017. Ideal para muros y fachadas con acabado limpio.', price: 0 },
    { name: 'Boquelón', description: 'Ladrillo boquelón para mampostería. Dimensiones: 80x23x8 cm. Peso: 10.4 a 10.6 Kg. Resistencia mínima 20 Kgf/cm². Rendimiento: 5 uds/m². Certificado NTC 6170 y NTC 4017.', price: 0 },
    { name: 'Estructural', description: 'Ladrillo estructural para cargas. Dimensiones: 29x10x12 cm. Peso: 3 a 3.3 Kg. Resistencia mínima 180 Kgf/cm². Rendimiento: 30 uds/m². Certificado NTC 6170 y NTC 4017. Ideal para muros estructurales y cimientos.', price: 0 },
    { name: 'Estructural Grande', description: 'Ladrillo estructural grande. Dimensiones: 29x12x21 cm. Peso: 6.5 Kg. Resistencia mínima 135 Kgf/cm². Rendimiento: 15 uds/m². Certificado NTC 6170 y NTC 4017. Para estructuras de mayor exigencia.', price: 0 },
    { name: 'M10', description: 'Ladrillo M10 para losa y entrepiso. Dimensiones: 24x10x6.5 cm. Peso: 1.7 a 2 Kg. Resistencia mínima 303-313 Kgf/cm². Rendimiento: 53 uds/m². Certificado NTC 6170 y NTC 4017. Especial para losas y entrepisos.', price: 0 },
    { name: 'Ladrillo Común', description: 'Ladrillo común de arcilla cocida. Dimensiones: 22x11x6 cm. Peso: 2 a 2.5 Kg. Rendimiento: 50 uds/m². Uso general en construcción.', price: 0 },
];

async function run() {
    console.log('Creating La Samaritana client...');
    
    // Check if already exists
    const { data: existing } = await supabase.from('clients').select('id, name').ilike('name', '%samaritana%');
    if (existing && existing.length > 0) {
        console.log('Client already exists:', existing[0]);
        return;
    }
    
    // Create client
    const { data: client, error: clientError } = await supabase.from('clients').insert([{
        name: 'La Samaritana',
        phone_number_id: PHONE_NUMBER_ID,
        whatsapp_token: WHATSAPP_TOKEN,
        prompt: PROMPT,
        active: true,
        model: 'gpt-4o',
        email: 'samaritana@ladrillera.com',
        client_password: 'sama2026'
    }]).select().single();
    
    if (clientError) {
        console.error('Error creating client:', clientError);
        return;
    }
    
    console.log('✅ Client created:', client.id, client.name);
    
    // Add products
    const productsToInsert = PRODUCTS.map(p => ({
        ...p,
        client_id: client.id,
    }));
    
    const { data: products, error: prodError } = await supabase.from('products').insert(productsToInsert).select();
    
    if (prodError) {
        console.error('Error creating products:', prodError);
        return;
    }
    
    console.log(`✅ Created ${products.length} products for La Samaritana`);
    products.forEach(p => console.log(`  - ${p.name}`));
    console.log('\n🎉 La Samaritana is ready! Client ID:', client.id);
}

run().catch(console.error);
