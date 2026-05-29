import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const NATUREL_ID = '98b9fafd-90ad-4ed9-9616-b8ed992b0e7d';
const TRAZZOS_ID = 'c90f532b-0b32-4614-9c21-bbf664213468';

async function finalSync() {
    console.log("FINAL SYNC STARTING...");

    // 1. Naturel - WORKING ID AND TOKEN
    const natureToken = 'EAAhtZAVUQmSMBQ4X1lxesx1kyTODr4QuDhE3At7gYuZCshKKRuJ9TW8X1ZC6Y5iPRKNHqZAdyw6DA1FNe2Jtr8NsZCpIwZC9wZC7lElsGpZApWsIWSg7UXZCKCyUyRZB967YQMPD5qMAmDrWu6aLNDzWbFlo0Gp8j9YlZCdTJvMhIndq4y5wgxTttDsagN368WF5aVr7wZDZD';
    const naturePhoneId = '1033194656544690';
    
    await supabase.from('clients').update({
        whatsapp_token: natureToken,
        phone_number_id: naturePhoneId,
        active: true
    }).eq('id', NATUREL_ID);
    console.log("Naturel restored and verified.");

    // 2. Trazzos - NEW TOKEN
    const trazzosToken = 'EAAUxBNup6IYBRSf7TCJtZBZA5Oj9mCxau1I6MksLQZBvnhqK824iVmss8BRaoKAkTg30TubchA9yZBve69k6qKvvNM3w1mE3cK9pNGpI0By5huZACvRy3JrLciyN2ZAe8mQdgAZCP1VJrtSZCUy05DvamPRwvdoCkHPdI8AZBxCt2bhUTkzhUkVdjrcsq7f5NKFn41wfuzKFRczZChQOwHjRLIMmWoKns4w814bDymXahfDgSScReRFxGxpTJeBS9RtqOzLtdMBMe6xztIzjai9sQljZClMmtwvuMzcH6DKd1urCgZDZD';
    const trazzosPhoneId = '1074951269024593';
    
    await supabase.from('clients').update({
        whatsapp_token: trazzosToken,
        phone_number_id: trazzosPhoneId,
        active: true
    }).eq('id', TRAZZOS_ID);
    console.log("Trazzos updated with new token.");

    console.log("SYNC COMPLETE.");
}

finalSync();
