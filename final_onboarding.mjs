import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zgkwgilghzgtteljfdqv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpna3dnaWxnaHpndHRlbGpmZHF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYzNjg4NiwiZXhwIjoyMDg4MjEyODg2fQ.BZu3JO7nMQ9rVtf9kUlS9VOX_6IYgPtXqudy3zZLjS4';

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

async function executeOnboarding() {
  console.log("Iniciando onboarding de Trazzos...");

  try {
    // 1. Crear el Cliente Trazzos
    const { data: client, error: clientErr } = await supabase
      .from('clients')
      .insert([{
        name: 'Trazzos',
        prompt: camiPrompt,
        model: 'openai/gpt-4o-mini',
        active: true,
        phone_number_id: '1234567890', // Placeholder
        whatsapp_token: 'dummy_token' // Placeholder
      }])
      .select()
      .single();

    if (clientErr) throw clientErr;
    console.log("Empresa Trazzos creada con ID:", client.id);

    // 2. Crear Usuario admin@trazzos.com
    const { data: userData, error: authErr } = await supabase.auth.admin.createUser({
      email: 'admin@trazzos.com',
      password: 'PasswordTrazzos2026',
      email_confirm: true
    });

    if (authErr) {
      if (authErr.message.includes('already registered')) {
        console.log("El usuario ya existe, vinculando...");
        // Intentar obtener el ID del usuario existente
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users.users.find(u => u.email === 'admin@trazzos.com');
        if (existingUser) {
           await linkUser(existingUser.id, client.id);
        }
      } else {
        throw authErr;
      }
    } else {
      console.log("Usuario Auth creado con ID:", userData.user.id);
      await linkUser(userData.user.id, client.id);
    }

    // 3. Insertar productos iniciales
    const initialProducts = [
      { name: 'Porcelanato Macerata Avellana 60x60', description: 'Porcelanato de alta resistencia ideal para interiores.', price: 85000, category: 'Porcelanato', stock: 100, min_stock: 10, client_id: client.id },
      { name: 'Pegante Porcelánico Gris x 25kg', description: 'Adhesivo especializado para revestimientos de baja absorción.', price: 32000, category: 'Pegante', stock: 50, min_stock: 5, client_id: client.id },
      { name: 'Torreducha Premium Negra', description: 'Experiencia tipo spa con acabado negro mate.', price: 450000, category: 'Grifería', stock: 15, min_stock: 2, client_id: client.id },
      { name: 'Remodelación Integral Obra Gris', description: 'Servicio llave en mano materiales + mano de obra.', price: 0, category: 'Servicios', stock: 999, min_stock: 0, client_id: client.id }
    ];
    await supabase.from('products').insert(initialProducts);

    // 4. Insertar leads de re-marketing
    const remarketingLeads = [
      { full_name: 'Juan Perez', phone: '573001234567', last_purchase_date: '2025-10-15T10:00:00Z', notes: 'Compró cerámica para sala, no volvió.', client_id: client.id },
      { full_name: 'Maria Gomez', phone: '573109876543', last_purchase_date: '2025-08-20T10:00:00Z', notes: 'Preguntó por cocinas pero no cerró.', client_id: client.id }
    ];
    await supabase.from('remarketing_leads').insert(remarketingLeads);

    console.log("¡Onboarding completado con éxito!");
  } catch (err) {
    console.error("Error durante el proceso:", err.message);
  }
}

async function linkUser(userId, clientId) {
  const { error } = await supabase.from('team_members').insert([{
    user_id: userId,
    client_id: clientId,
    role: 'admin',
    full_name: 'Administrador Trazzos',
    status: 'activo'
  }]);
  if (error) console.error("Error vinculando equipo:", error.message);
  else console.log("Usuario vinculado a la empresa Trazzos.");
}

executeOnboarding();
