import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const NATUREL_ID = '98b9fafd-90ad-4ed9-9616-b8ed992b0e7d';
const TRAZZOS_ID = 'c90f532b-0b32-4614-9c21-bbf664213468';
const TEST_PHONE_ID = '1074951269024593';

async function finalFix() {
    console.log("Starting FINAL FIX...");

    // 1. Unassign the test phone from Naturel
    await supabase.from('clients').update({ 
        phone_number_id: 'PRODUCTION_NATUREL_ID', // Reset to something else
        whatsapp_token: null 
    }).eq('id', NATUREL_ID);
    console.log("Cleared Naturel phone ID.");

    // 2. Assign the test phone to Trazzos
    await supabase.from('clients').update({ 
        phone_number_id: TEST_PHONE_ID,
        whatsapp_token: 'EAAUxBNup6IYBRc0VvtqDEdiK5pZBcl6gC4BTk5t2icJMqZBIDOPoqTtfiMZARcb7ubJE3Q1tZBXuIWMrRKODJ3EZA7yZBz18EHpmaCxZAsurNgZCoFhy4QJWBkJ4dfA0xHjXif74ig8UqZAmqJZBMoscTSR7Wl8JDZBVHWo8jIfF85ODXfdZC5ZCZB2m5ACMt7jRF1YhZBJ7mCrwZANpGRHyjA5OCqm0sHgHwLBg454s0Seo8M8dBj930Pqb2sT27kshOTrwTQgLvUBhxHh5rHIl5reEE82FrDyqv2OwZC9LVihW6kgZDZD'
    }).eq('id', TRAZZOS_ID);
    console.log("Assigned Test Phone ID to Trazzos.");

    // 3. Move conversations from Cristian (573163799745) to Trazzos
    const { error: moveErr } = await supabase
        .from('conversations')
        .update({ client_id: TRAZZOS_ID })
        .eq('user_phone', '573163799745')
        .eq('client_id', NATUREL_ID);
    
    console.log("Moved conversations to Trazzos:", moveErr || "Success");
}

finalFix();
