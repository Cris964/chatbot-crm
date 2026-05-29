import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TRAZZOS_ID_1 = 'c90f532b-0b32-4614-9c21-bbf664213468';
const TRAZZOS_ID_2 = '5ac584f8-1d98-4583-9c2c-76a3c3cfe07d';
const NEW_TOKEN = 'EAASr9DekULIBRffnEZCTBoAW0fnthhvPl6gLEjUGe9jjCO69qksRfsXX4zlNH2wULZAt86FU28f3ZCXtqQyelNg2amheplGpIEFjxb5jNGZCAZBeiYTZAfjUZCsKFK3QjgoAAHhPb3UcHwGufRXJbhznu5UZCKSi78S4CWZB4ZBGJQA05ZBxylAARzGEVDTzwwMJP9C0JfZBejBoGul6RYLZCSYL90zNSUG6oDAcRBdBYL6uCNyLuJxZCHpVEtT6OpEU4cFTf7KaJMw6jAV0tC221BMBZBNRNqQGqoZBORNlZCkoiqgZDZD';

async function updateTrazzosTokens() {
    console.log("Updating Trazzos Tokens in database...");
    
    // Update main Trazzos
    await supabase.from('clients').update({
        whatsapp_token: NEW_TOKEN,
        active: true
    }).eq('id', TRAZZOS_ID_1);

    // Update test Trazzos
    await supabase.from('clients').update({
        whatsapp_token: NEW_TOKEN,
        active: true
    }).eq('id', TRAZZOS_ID_2);
    
    console.log("Trazzos tokens updated successfully.");
}

updateTrazzosTokens();
