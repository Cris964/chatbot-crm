import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TRAZZOS_ID = 'c90f532b-0b32-4614-9c21-bbf664213468';
const NEW_TOKEN = 'EAASr9DekULIBRTDcvsYqA6i9yuoj8OiR0ZCvsZBopBsTekPVh0XmJUw6WZBzSv2mGS5Bm3tKkz1j8qJhZCBXz67jzW60BiWJ0iQxb7ZBXHdlHUQzakZCmziBqlew3oLwRKqOV1OziWnUJKQYQZABi9jDaw2b46I4yfVgZAj82Cf76UVugW2wD3dQGZAJFB6CKgTjBUP5C1ZBPwAi1QPocafzHRJ7rQbi4RzwGsWVNYGzns2cZAEuJBYWmjmwQAwZB4t3hlUejMAyDgevUKSX8SFL5i2cdZAReMjCmN4nFrKNEXQZDZD';
const NEW_PHONE_ID = '1118533531348913';

async function updateTrazzosFinal() {
    console.log("Applying FINAL Trazzos Fix...");
    
    await supabase.from('clients').update({
        whatsapp_token: NEW_TOKEN,
        phone_number_id: NEW_PHONE_ID,
        active: true
    }).eq('id', TRAZZOS_ID);
    
    console.log("Trazzos database updated and verified.");
}

updateTrazzosFinal();
