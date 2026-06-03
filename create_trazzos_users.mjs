import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TRAZZOS_ID = 'c90f532b-0b32-4614-9c21-bbf664213468'; // Trazzos Espacios y Arquitectura
const USERS = [
  { email: 'asesor@trazzos.com', name: 'Asesor Comercial Trazzos', role: 'vendedor' },
  { email: 'crearte@trazzos.com', name: 'Crearte Remodelaciones', role: 'vendedor' }
];

async function run() {
  for (const u of USERS) {
    console.log(`Creating user ${u.email}...`);
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: 'Trazzos2026!',
      email_confirm: true
    });

    if (authError) {
      if (authError.message.includes('User already registered')) {
        console.log(`User ${u.email} already exists in auth.`);
      } else {
        console.error('Error creating user:', authError);
        continue;
      }
    }

    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const user = existingUser.users.find(x => x.email === u.email);

    if (user) {
      // Check if team member exists
      const { data: tm } = await supabase.from('team_members').select('*').eq('user_id', user.id).eq('client_id', TRAZZOS_ID).single();
      if (!tm) {
        const { error: tmError } = await supabase.from('team_members').insert([{
          user_id: user.id,
          client_id: TRAZZOS_ID,
          role: u.role,
          full_name: u.name,
          email: u.email,
          status: 'activo'
        }]);
        if (tmError) console.error('Error adding team member:', tmError);
        else console.log(`Team member added for ${u.email}.`);
      } else {
        console.log(`Team member already exists for ${u.email}.`);
      }
    }
  }
  console.log('Done!');
}
run();
