import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function changePassword() {
  const email = 'admin@trazzos.com';
  const newPassword = 'Admintrazzos123';

  // Find user
  const { data: users, error: fetchError } = await supabase.auth.admin.listUsers();
  if (fetchError) {
    console.error("Error fetching users:", fetchError);
    return;
  }

  const user = users.users.find(u => u.email === email);
  if (!user) {
    console.error(`User ${email} not found.`);
    return;
  }

  // Update password
  const { data, error } = await supabase.auth.admin.updateUserById(
    user.id,
    { password: newPassword }
  );

  if (error) {
    console.error("Error updating password:", error);
  } else {
    console.log(`Password for ${email} successfully updated.`);
  }
}

changePassword();
