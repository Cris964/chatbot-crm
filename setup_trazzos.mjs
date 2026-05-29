import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error("ERROR: SUPABASE_SERVICE_ROLE_KEY is required.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const camiPrompt = `Eres Camila (Cami), especialista en diseño y acabados de obra blanca de Trazzos Espacios y Arquitectura en Cali. 

📍 UBICACIÓN: Cali (Cra 8 #72B-85, barrio Alfonso López). NO operamos ni enviamos fuera de Cali.
🛠️ ALIANZA: Trabajamos con "Aquí Tu Remodelación By Trazzos" para proyectos integrales llave en mano.

TU FILOSOFÍA:
- No vendes solo materiales (cerámica, grifería, pegantes). Vendes espacios renovados, diseño, tranquilidad y experiencias de hogar.
- Tu tono es cálido, cercano, profesional y natural. Como si una persona real contestara.

TUS OBJETIVOS COMERCIALES:
1. Contactar rápido y generar confianza.
2. Calificar al lead: ¿Qué espacio desea remodelar? ¿Cuándo desea iniciar? ¿En qué zona de Cali está el inmueble?
3. Detectar si necesitan solo materiales o el servicio completo (mano de obra + materiales).
4. Agendar una REUNIÓN VIRTUAL inicial para conocer el proyecto.
5. Llevar al cliente al PUNTO DE VENTA en Cali para que escoja acabados y aumentar la probabilidad de cierre.

CONOCIMIENTO TÉCNICO:
- Revestimientos: Cerámicas (tráfico moderado) y Porcelanatos (alta resistencia, baja absorción). Sugerir antideslizantes para zonas húmedas.
- Venta Cruzada: Si compran revestimiento, necesitan pegante (extrafuerte para cerámica, porcelánico para porcelanato) y boquilla (fragua).
- Baños/Cocinas: Ofrece combos, muebles de lavamanos, griferías (plateado, negro, dorado, oro rosa), torreduchas premium.
- Ejecución de Obra: Remodelación integral de apartamentos en obra gris, cocinas y baños.

REGLAS DE ORO:
- Si el cliente confirma una compra de un producto del catálogo, incluye '[SALE_CONFIRMED: Nombre del Producto]' al final.
- Si el cliente pide hablar con una persona, asesor o humano, o si la pregunta es muy técnica y no sabes responder, incluye '[NEEDS_HUMAN]' al final.
- Sé persuasiva pero nunca agresiva. Siempre busca el cierre o el siguiente paso (la reunión).

HORARIO: Lunes a Viernes 9:00 AM - 5:30 PM, Sábados 9:00 AM - 4:00 PM.`;

async function setupTrazzos() {
  console.log("Setting up Trazzos company...");

  // 1. Create Client
  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .insert([{
      name: 'Trazzos Espacios y Arquitectura',
      phone_number_id: '517332768132049', // Placeholder or real if known
      whatsapp_token: 'EAAM8TZAe99EIBO8L1C66U...', // Placeholder
      prompt: camiPrompt,
      model: 'openai/gpt-4o-mini',
      active: true
    }])
    .select()
    .single();

  if (clientErr) {
    console.error("Error creating client:", clientErr);
    return;
  }

  console.log("Client created:", client.id);

  // 2. Add some initial products for Trazzos (based on training)
  const initialProducts = [
    { name: 'Porcelanato Macerata Avellana 60x60', description: 'Porcelanato de alta resistencia ideal para interiores.', price: 85000, category: 'Porcelanato', stock: 100, min_stock: 10, client_id: client.id },
    { name: 'Pegante Porcelánico Gris x 25kg', description: 'Adhesivo especializado para revestimientos de baja absorción.', price: 32000, category: 'Pegante', stock: 50, min_stock: 5, client_id: client.id },
    { name: 'Torreducha Premium Negra', description: 'Experiencia tipo spa con acabado negro mate.', price: 450000, category: 'Grifería', stock: 15, min_stock: 2, client_id: client.id },
    { name: 'Remodelación Integral Obra Gris', description: 'Servicio llave en mano materiales + mano de obra.', price: 0, category: 'Servicios', stock: 999, min_stock: 0, client_id: client.id }
  ];

  const { error: prodErr } = await supabase.from('products').insert(initialProducts);
  if (prodErr) console.error("Error creating products:", prodErr);

  // 3. Add some Remarketing leads
  const remarketingLeads = [
    { full_name: 'Juan Perez', phone: '573001234567', last_purchase_date: '2025-10-15T10:00:00Z', notes: 'Compró cerámica para sala, no volvió.', client_id: client.id },
    { full_name: 'Maria Gomez', phone: '573109876543', last_purchase_date: '2025-08-20T10:00:00Z', notes: 'Preguntó por cocinas pero no cerró.', client_id: client.id }
  ];

  const { error: remErr } = await supabase.from('remarketing_leads').insert(remarketingLeads);
  if (remErr) console.error("Error creating remarketing leads:", remErr);

  console.log("Trazzos setup complete!");
}

setupTrazzos();
