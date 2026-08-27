import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function mergeConversations() {
    console.log("Fetching CO. duplicates...");
    const { data: coConvs } = await supabase.from('conversations').select('*').ilike('user_phone', 'CO.%');
    
    for (const coConv of coConvs) {
        const rawPhone = coConv.user_phone.replace(/^CO\./, '');
        
        // Find if there is a matching conversation without CO.
        const { data: targetConvs } = await supabase.from('conversations').select('*').eq('client_id', coConv.client_id).eq('user_phone', rawPhone);
        
        if (targetConvs && targetConvs.length > 0) {
            const targetConv = targetConvs[0];
            console.log(`Merging ${coConv.user_phone} into ${targetConv.user_phone}`);
            
            // Merge messages
            const allMessages = [...(coConv.messages || []), ...(targetConv.messages || [])];
            allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            // Delete the CO. conversation
            await supabase.from('conversations').delete().eq('id', coConv.id);
            
            // Update the target conversation
            await supabase.from('conversations').update({ messages: allMessages }).eq('id', targetConv.id);
        } else {
            console.log(`Renaming ${coConv.user_phone} to ${rawPhone}`);
            // Just rename it
            await supabase.from('conversations').update({ user_phone: rawPhone }).eq('id', coConv.id);
        }
    }
    console.log("Merge complete.");
}

mergeConversations();
