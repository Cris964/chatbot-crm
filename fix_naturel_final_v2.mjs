import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const NATUREL_ID = '98b9fafd-90ad-4ed9-9616-b8ed992b0e7d';
const REAL_WORKING_ID = '1033194656544690';

async function finalFixNaturel() {
    console.log("Applying the REAL WORKING ID to Naturel...");
    
    await supabase.from('clients').update({
        phone_number_id: REAL_WORKING_ID,
        active: true
    }).eq('id', NATUREL_ID);
    
    console.log("Naturel fixed with ID 1033194656544690.");
}

finalFixNaturel();
