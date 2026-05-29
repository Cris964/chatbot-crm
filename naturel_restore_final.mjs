import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const NATUREL_ID = '98b9fafd-90ad-4ed9-9616-b8ed992b0e7d';

async function natureRestore() {
    const token = 'EAAhtZAVUQmSMBQ4X1txesx1kyTODr4QuDhE3At7gYuZCshKKRuJ9TW8X1ZC6Y5iPRKNHqZAdyw6DA1FNe2Jtr8NsZCpIwZC9wZC7lElsGpZApWsIWSg7UXZCKCyUyRZB967YQMPD5qMAmDrWu6aLNDzWbFlo0Gp8j9YlZCdTJvMhIndq4y5wgxTttDsagN368WF5aVr7wZDZD';
    
    // We will try the ID the user just gave us
    const phoneId = '1273502074728890'; 

    console.log(`Restoring Naturel with ID ${phoneId}...`);
    
    await supabase.from('clients').update({
        whatsapp_token: token,
        phone_number_id: phoneId,
        active: true
    }).eq('id', NATUREL_ID);
    
    console.log("Database updated.");
}

natureRestore();
