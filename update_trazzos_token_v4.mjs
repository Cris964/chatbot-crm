import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TRAZZOS_ID_1 = 'c90f532b-0b32-4614-9c21-bbf664213468';
const TRAZZOS_ID_2 = '5ac584f8-1d98-4583-9c2c-76a3c3cfe07d';
const NEW_TOKEN = 'EAASr9DekULIBRkZCVZAl8rVZBWXC5HDDKgfAktZCHzCGf7EyHAwZAIv5qbQeZBJHzLK1jbc1hOZCicz3uPFc5NhzEch2btoxpGXVVsSYBZAUGUogGaZCo9ZAds9x9C67ZB8hmq9viVlysD18WWc7wZAHFRblJiVDh0a4qWZB8er94GZBCb0GPaMUKBTflqOXdZAjeSeaOIKGZBwlzgZBYwmgXoiJIfpCJ6fNOZBq7qpQxzBF19NSuWR5kZAZAvXE5jKlyjheMH9MQZBNga3YqROQZCbgRFTxsOnsQvhlkChSHPY05g1moJtgZDZD';

async function updateTrazzosTokens() {
    console.log("Updating Trazzos Tokens in database...");
    
    await supabase.from('clients').update({
        whatsapp_token: NEW_TOKEN,
        active: true
    }).eq('id', TRAZZOS_ID_1);

    await supabase.from('clients').update({
        whatsapp_token: NEW_TOKEN,
        active: true
    }).eq('id', TRAZZOS_ID_2);
    
    console.log("Trazzos tokens updated successfully.");
}

updateTrazzosTokens();
