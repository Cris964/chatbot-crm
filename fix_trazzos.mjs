import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixDB() {
    // 1. Move the test credentials to the REAL Trazzos
    await supabase.from('clients').update({
        phone_number_id: '1074951269024593',
        whatsapp_token: 'EAAUxBNup6IYBReC71GEi6FnMQGrvov3jy2HLY1YkGT8iDxlFZB6yA1UtfCxEz8qSMT3ZBUaByAVYZChAYxgiLu1796LzHUsAAnRy7dvqLDGjoFAm4htfoHviW3cKe8kvnM3ZBV7xZCBvfuJKrtrbubIJO9ZC2YXPJ8EZAHKZAWCB2arp0CZA0kHXoftAwZCPzgEgWC1NSwLGJHZC3gK1iQjHQX0Ij53d9F5GQgOdaX7vZCVkixhTX4wnfG0SS1UCOJxZAQNl1SvtqDXw7H55iUTki1QpHYiIKIFZCRgWTouwu2SwZDZD'
    }).eq('id', 'c90f532b-0b32-4614-9c21-bbf664213468');

    // 2. Clear the test credentials from Naturel (to fallback to .env)
    await supabase.from('clients').update({
        phone_number_id: null,
        whatsapp_token: null
    }).eq('id', '98b9fafd-90ad-4ed9-9616-b8ed992b0e7d');

    // 3. Fix the team members: assign them to the real Trazzos
    const { data: users } = await supabase.from('team_members').select('*');
    for (let u of users) {
        if (u.client_id === '98b9fafd-90ad-4ed9-9616-b8ed992b0e7d') {
            await supabase.from('team_members').update({ client_id: 'c90f532b-0b32-4614-9c21-bbf664213468' }).eq('id', u.id);
        }
    }
    console.log("DB Fixed!");
}
fixDB();
