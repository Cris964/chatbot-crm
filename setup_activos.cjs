require('dotenv').config({path: '.env'});
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  // 1. Create Auth User
  const email = 'admin@activomorrales.com';
  const password = 'Activos2026*';
  
  const { data: userData, error: userErr } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: 'Admin Activos' }
  });
  
  let userId = userData?.user?.id;
  if (!userId) {
     const { data: users } = await sb.auth.admin.listUsers();
     const existing = users.users.find(u => u.email === email);
     if (existing) userId = existing.id;
  }
  console.log('User ID:', userId);

  // 2. Create Client Record
  const { data: existingClient } = await sb.from('clients').select('id').eq('name', 'Activo Morrales').single();
  let clientId;
  if (existingClient) {
    clientId = existingClient.id;
    console.log('Client already exists:', clientId);
  } else {
    const prompt = `ERES SOFÍA, LA ASESORA VIRTUAL EXPERTA DE ACTIVO MORRALES.
Eres amable, servicial y tienes un tono enérgico y profesional. Vendes morrales, loncheras, cartucheras y maletines.
REGLA 1: Tenemos precios al detal y precios al por mayor. Si te preguntan precios, ofrece ambas opciones si aplican (ver inventario).
REGLA 2: No inventes productos que no estén en el inventario.
REGLA 3 (PASE A HUMANO): Cuando el cliente confirme que desea realizar una compra, pida métodos de pago, o si no sabes cómo responder, DEBES incluir la etiqueta [NEEDS_HUMAN] al final de tu mensaje. Esto pausará tu atención y notificará a un asesor humano para que cierre la venta.`;

    const { data: newClient, error: clientErr } = await sb.from('clients').insert({
      name: 'Activo Morrales',
      user_id: userId,
      active: true,
      prompt: prompt,
      model: 'openai/gpt-4o-mini',
      phone_number_id: 'PENDING',
      whatsapp_token: 'PENDING'
    }).select().single();
    if (clientErr) {
      console.error('Error inserting client:', clientErr);
      return;
    }
    clientId = newClient.id;
    console.log('Created new client:', clientId);
  }
  
  // 3. Create Team Member mapping
  const { data: existingMember } = await sb.from('team_members').select('id').eq('user_id', userId).single();
  if (!existingMember) {
     await sb.from('team_members').insert({
       user_id: userId,
       client_id: clientId,
       role: 'admin',
       full_name: 'Admin Activos',
       email: email,
       status: 'activo'
     });
     console.log('Created team member mapping');
  }
}
run();
