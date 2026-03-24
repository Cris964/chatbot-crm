import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zgkwgilghzgtteljfdqv.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpna3dnaWxnaHpndHRlbGpmZHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzY4ODYsImV4cCI6MjA4ODIxMjg4Nn0.qqRN2DJJtYxRmwXkZwobnxQK5hJb3HwEQEVTVPUzTMI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOutbox() {
  console.log('Testing insertion into outbox...');
  
  // We need to use the token of the logged-in user if RLS is enabled on insert.
  // Wait, if RLS is enabled, anon key might not work.
  // We will try anyway. If it fails with RLS, we'll need to auth first.
  
  // First, let's login
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'naturel@admin.com',
    password: 'Admin123'
  });

  if (authError) {
    console.error('Auth error:', authError);
    return;
  }
  
  console.log('Logged in successfully. User ID:', authData.user.id);

  const testPayload = {
    user_phone: '573163799745',
    phone: '573163799745',
    message: 'Test message from Node script ' + Date.now(),
    status: 'pending',
    user_id: authData.user.id
  };

  const { data, error } = await supabase
    .from('outbox')
    .insert([testPayload])
    .select();

  if (error) {
    import('fs').then(fs => {
      fs.writeFileSync('error_dump.json', JSON.stringify(error, null, 2));
      console.error('Error written to error_dump.json');
    });
  } else {
    console.log('Insertion SUCCESS! Data:', data);
  }
}

testOutbox();
