import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const trazzosToken = 'EAAcDxCANIDoBRhduZCpo8bzVzZBRUdpe8hA77J2RRgXnCSxteghrjFSBvAFWsZBbrKqxGdWd00dNfYluUeRS7xS0Ouwo9OsfN3ghLZCQJj4NdtB0Y0HZAPcISyHrPfMTjkB1oYYP2xWVPRSDdNdRyIA3nbfYZC7hXkV3yDxwmXnX6kZBiGFibHf64iH9WORHTBeiQZDZD';
  
  await supabase.from('clients').update({ whatsapp_token: trazzosToken }).eq('id', 'c90f532b-0b32-4614-9c21-bbf664213468');
  await supabase.from('clients').update({ whatsapp_token: trazzosToken }).eq('id', '5ac584f8-1d98-4583-9c2c-76a3c3cfe07d');
  
  console.log("Trazzos Tokens updated in DB.");
}
check();
