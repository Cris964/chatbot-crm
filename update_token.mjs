import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function updateToken() {
    const { data, error } = await supabase
        .from('clients')
        .update({ whatsapp_token: 'EAAUxBNup6IYBReC71GEi6FnMQGrvov3jy2HLY1YkGT8iDxlFZB6yA1UtfCxEz8qSMT3ZBUaByAVYZChAYxgiLu1796LzHUsAAnRy7dvqLDGjoFAm4htfoHviW3cKe8kvnM3ZBV7xZCBvfuJKrtrbubIJO9ZC2YXPJ8EZAHKZAWCB2arp0CZA0kHXoftAwZCPzgEgWC1NSwLGJHZC3gK1iQjHQX0Ij53d9F5GQgOdaX7vZCVkixhTX4wnfG0SS1UCOJxZAQNl1SvtqDXw7H55iUTki1QpHYiIKIFZCRgWTouwu2SwZDZD' })
        .eq('id', '98b9fafd-90ad-4ed9-9616-b8ed992b0e7d');
    console.log("Updated Trazzos WhatsApp token:", error || data);
}
updateToken();
