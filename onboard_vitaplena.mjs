import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zgkwgilghzgtteljfdqv.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpna3dnaWxnaHpndHRlbGpmZHF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYzNjg4NiwiZXhwIjoyMDg4MjEyODg2fQ.BZu3JO7nMQ9rVtf9kUlS9VOX_6IYgPtXqudy3zZLjS4';

const supabase = createClient(supabaseUrl, supabaseKey);

const vitaplenaPrompt = `Eres el especialista en ventas y asesor de bienestar de VitaPlena.

TU PRODUCTO ESTRELLA (Y NICO PRODUCTO):
- Vendes EXCLUSIVAMENTE "Golden Plus", un potente potencializador natural.
- Golden Plus est diseado para aumentar la energa, mejorar la vitalidad y el rendimiento general.

TU FILOSOFA Y TONO:
- Tu tono es profesional, discreto, persuasivo y muy respetuoso.
- Generas confianza rpidamente, entendiendo que es un producto orientado al bienestar ntimo y energtico.
- No suenas como un robot, eres un asesor experto dispuesto a resolver dudas.

TUS OBJETIVOS COMERCIALES:
1. Contactar rpido, saludar amablemente y generar inters en Golden Plus.
2. Explicar brevemente los beneficios (ms energa, mejor rendimiento, frmula natural).
3. Cerrar la venta capturando los datos del cliente: Nombre, Direccin de Envo y Ciudad.
4. Si el cliente confirma la compra, incluye la etiqueta '[SALE_CONFIRMED: Golden Plus]' al final de tu mensaje.

REGLAS DE ORO:
- Si el cliente hace preguntas mdicas complejas o pide hablar con un humano, incluye '[NEEDS_HUMAN]' en tu respuesta.
- Mantn el enfoque en los beneficios de Golden Plus.
- S persuasivo pero no presiones agresivamente.`;

async function executeOnboarding() {
  console.log("Iniciando onboarding de VitaPlena...");

  try {
    // 1. Crear el Cliente VitaPlena
    const { data: client, error: clientErr } = await supabase
      .from('clients')
      .insert([{
        name: 'VitaPlena',
        prompt: vitaplenaPrompt,
        model: 'openai/gpt-4o-mini',
        active: true,
        phone_number_id: 'PENDING', // El usuario proveer esto
        whatsapp_token: 'PENDING' // El usuario proveer esto
      }])
      .select()
      .single();

    if (clientErr) throw clientErr;
    console.log("Empresa VitaPlena creada con ID:", client.id);

    // 2. Crear Usuario admin@vitaplena.com
    const { data: userData, error: authErr } = await supabase.auth.admin.createUser({
      email: 'admin@vitaplena.com',
      password: 'PasswordVitaPlena2026',
      email_confirm: true
    });

    if (authErr) {
      if (authErr.message.includes('already registered')) {
        console.log("El usuario ya existe, vinculando...");
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users.users.find(u => u.email === 'admin@vitaplena.com');
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

    // 3. Insertar el producto Golden Plus
    const initialProducts = [
      { 
        name: 'Golden Plus', 
        description: 'Potencializador natural para mxima energa y vitalidad.', 
        price: 50000, // Precio base, ajustar luego
        category: 'Bienestar', 
        stock: 100, 
        min_stock: 10, 
        client_id: client.id 
      }
    ];
    await supabase.from('products').insert(initialProducts);

    console.log("Onboarding completado con xito! Esperando credenciales de WhatsApp.");
  } catch (err) {
    console.error("Error durante el proceso:", err.message);
  }
}

async function linkUser(userId, clientId) {
  const { error } = await supabase.from('team_members').insert([{
    user_id: userId,
    client_id: clientId,
    role: 'admin',
    full_name: 'Administrador VitaPlena',
    status: 'activo'
  }]);
  if (error) console.error("Error vinculando equipo:", error.message);
  else console.log("Usuario vinculado a la empresa VitaPlena.");
}

executeOnboarding();
