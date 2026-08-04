const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const clientId = 'c91119cc-5451-4a64-b0e8-6b53d33d5563';

  // Obtener todas las conversaciones con el nombre "Contacto"
  const { data: convs } = await supabase
    .from('conversations')
    .select('id, user_phone, user_name')
    .eq('client_id', clientId)
    .eq('user_name', 'Contacto');
    
  console.log(`Found ${convs.length} conversations named "Contacto"`);
  
  if (convs.length === 0) return;
  
  // Obtener todos los contactos de difusin
  const { data: contacts } = await supabase
    .from('broadcast_contacts')
    .select('phone, full_name')
    .eq('client_id', clientId);
    
  // Crear mapa
  const contactMap = {};
  contacts.forEach(c => {
    contactMap[c.phone] = c.full_name;
  });
  
  // Actualizar conversaciones
  let updatedCount = 0;
  for (const conv of convs) {
    const name = contactMap[conv.user_phone];
    if (name) {
      await supabase.from('conversations').update({ user_name: name }).eq('id', conv.id);
      updatedCount++;
    }
  }
  
  console.log(`Updated ${updatedCount} conversations with correct names.`);
}

run();
