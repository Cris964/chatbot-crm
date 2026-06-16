import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function renameCreartToTrearq() {
    const clientId = 'c90f532b-0b32-4614-9c21-bbf664213468';
    
    console.log("1. Fetching Trazzos Prompt...");
    const { data: clients } = await supabase.from('clients').select('id, prompt').eq('id', clientId);
    
    if (clients && clients.length > 0) {
        let prompt = clients[0].prompt;
        
        // Replace all variations of Creart/Crearte with Trearq
        prompt = prompt.replace(/CREARTE/g, 'TREARQ');
        prompt = prompt.replace(/CREART/g, 'TREARQ');
        prompt = prompt.replace(/Crearte/g, 'Trearq');
        prompt = prompt.replace(/Creart/g, 'Trearq');
        prompt = prompt.replace(/crearte/g, 'trearq');
        prompt = prompt.replace(/creart/g, 'trearq');
        
        await supabase.from('clients').update({ prompt }).eq('id', clientId);
        console.log('✅ Prompt updated: replaced Creart with Trearq');
    }

    console.log("2. Updating team_members email and name...");
    // Update the email and full_name where email is crearte@trazzos.com
    const { error: teamErr } = await supabase
        .from('team_members')
        .update({ 
            email: 'trearq@trazzos.com',
            full_name: 'Trearq Remodelaciones'
        })
        .eq('email', 'crearte@trazzos.com');
        
    if (teamErr) {
        console.error("Error updating team_members:", teamErr);
    } else {
        console.log('✅ team_members updated: crearte@trazzos.com -> trearq@trazzos.com');
    }
}

renameCreartToTrearq();
