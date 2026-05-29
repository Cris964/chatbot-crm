import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TRAZZOS_ID = 'c90f532b-0b32-4614-9c21-bbf664213468';
const NEW_PHONE_ID = '1131600676705092';
const NEW_TOKEN = 'EAA4qzHxUJVEBRadEnIlqOOwk7ZAZAuZChOhyytbHyi4egN5jJ0O6ZAKZAVd52Dz0nFeTqOo6CrEqnZA1PF2KOMs0NBaZCSOupIjsXumvozkMiFOwHy0ZBZBXetLG9R1xIL9afdUwGl5y4GjxRaswi7dNNrKQry5UXRmBaQq5TSrlT38qtd88yyFg9QwLrsDBgZCwt2P2hAoBZBJFRnHbU9OEO5e7919wF145nm9RfIh6asSajx09kDJSwqqZBwudlVW6N4MRi723uhWpmNIp5N4PrrG9iVqg6ZBDFXHkDlZAZAWGAZDZD';

async function updateTrazzos() {
    console.log("Updating Trazzos with NEW TEST NUMBER...");
    
    const { error } = await supabase.from('clients').update({
        phone_number_id: NEW_PHONE_ID,
        whatsapp_token: NEW_TOKEN,
        active: true
    }).eq('id', TRAZZOS_ID);
    
    if (error) {
        console.error("Error updating Trazzos:", error);
    } else {
        console.log("Trazzos updated successfully.");
    }
}

updateTrazzos();
