const { createClient } = require('@supabase/supabase-js'); 
require('dotenv').config(); 
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); 

async function run() { 
  const email = 'daniela@activomorrales.com';
  const password = 'Activo2026*';
  const clientId = 'c91119cc-5451-4a64-b0e8-6b53d33d5563'; // Activo Morrales

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError) {
     console.error('Error creating user:', authError);
     return;
  }

  const userId = authData.user.id;
  console.log('User created in Auth with ID:', userId);

  // 2. Insert into team_members
  const { error: teamError } = await supabase.from('team_members').insert([{
    user_id: userId,
    client_id: clientId,
    role: 'asesor',
    full_name: 'Daniela',
    email: email,
    status: 'activo'
  }]);

  if (teamError) {
     console.error('Error creating team member:', teamError);
  } else {
     console.log('Team member Daniela added successfully.');
  }
} 
run();
