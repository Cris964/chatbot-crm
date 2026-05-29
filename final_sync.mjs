import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const NATUREL_ID = '98b9fafd-90ad-4ed9-9616-b8ed992b0e7d';
const TRAZZOS_ID = 'c90f532b-0b32-4614-9c21-bbf664213468';

async function updateTokens() {
    console.log("Updating Tokens for both clients...");

    // 1. Naturel - Using the token and ID from Railway screenshot
    const natureToken = 'EAAhLZAVUQmSMBQ4X1lxesx1ky1QDr4QuDhE3AL/gYuZCshKKRuJ9TWBX1ZC6Y5iPRKNIiqZAdyw6DA1fNe2JTrBNsZCPiWZC9wZC71FlSgp7ApWsTWsg7UX7CKCyllyR7B967YQMPD5qMaMDrWu6alNDzWbFiOO8p8j9Y1ZCdlJvMhIndq4ySwgxiltDSagN368WF5aVr7wZDZD';
    const naturePhoneId = '127350207278890'; // From Railway screenshot
    
    await supabase.from('clients').update({
        whatsapp_token: natureToken,
        phone_number_id: naturePhoneId,
        active: true
    }).eq('id', NATUREL_ID);
    console.log("Naturel Updated.");

    // 2. Trazzos - Using the NEW token from user
    const trazzosToken = 'EAAUxBNup6IYBRSf7TCJtZBZA5Oj9mCxau1I6MksLQZBvnhqK824iVmss8BRaoKAkTg30TubchA9yZBve69k6qKvvNM3w1mE3cK9pNGpI0By5huZACvRy3JrLciyN2ZAe8mQdgAZCP1VJrtSZCUy05DvamPRwvdoCkHPdI8AZBxCt2bhUTkzhUkVdjrcsq7f5NKFn41wfuzKFRczZChQOwHjRLIMmWoKns4w814bDymXahfDgSScReRFxGxpTJeBS9RtqOzLtdMBMe6xztIzjai9sQljZClMmtwvuMzcH6DKd1urCgZDZD';
    const trazzosPhoneId = '1074951269024593';
    
    await supabase.from('clients').update({
        whatsapp_token: trazzosToken,
        phone_number_id: trazzosPhoneId,
        active: true
    }).eq('id', TRAZZOS_ID);
    console.log("Trazzos Updated.");
}

updateTokens();
