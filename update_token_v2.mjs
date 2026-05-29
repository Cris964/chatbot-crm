import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function updateToken() {
    const { data, error } = await supabase
        .from('clients')
        .update({ whatsapp_token: 'EAAUxBNup6IYBRc0VvtqDEdiK5pZBcl6gC4BTk5t2icJMqZBIDOPoqTtfiMZARcb7ubJE3Q1tZBXuIWMrRKODJ3EZA7yZBz18EHpmaCxZAsurNgZCoFhy4QJWBkJ4dfA0xHjXif74ig8UqZAmqJZBMoscTSR7Wl8JDZBVHWo8jIfF85ODXfdZC5ZCZB2m5ACMt7jRF1YhZBJ7mCrwZANpGRHyjA5OCqm0sHgHwLBg454s0Seo8M8dBj930Pqb2sT27kshOTrwTQgLvUBhxHh5rHIl5reEE82FrDyqv2OwZC9LVihW6kgZDZD' })
        .eq('id', 'c90f532b-0b32-4614-9c21-bbf664213468');
    console.log("Updated Trazzos WhatsApp token to the NEW ONE:", error || data);
}
updateToken();
