import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function syncClient() {
    console.log('--- Syncing Client Phone Number ID ---');
    const clientId = '98b9fafd-90ad-4ed9-9616-b8ed992b0e7d';
    const phoneId = '1033194656544690';
    
    const { data, error } = await supabase.from('clients')
        .update({ phone_number_id: phoneId, active: true })
        .eq('id', clientId);
    
    if (error) {
        console.error('Update FAILED:', error.message);
    } else {
        console.log('Update SUCCESS! phone_number_id set for', clientId);
    }
}

syncClient();
