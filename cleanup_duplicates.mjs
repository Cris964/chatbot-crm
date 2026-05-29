import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const NATUREL_CLIENT_ID = '98b9fafd-90ad-4ed9-9616-b8ed992b0e7d';
const TRAZZOS_CLIENT_ID = 'c90f532b-0b32-4614-9c21-bbf664213468';

async function cleanup() {
    console.log("Starting cleanup of team_members duplicates...");
    
    // Get all team members for the test users
    const testEmails = ['admin@chekadmin.com', 'naturel@admin.com', 'demo@nexuscrm.com'];
    
    for (const email of testEmails) {
        console.log(`Cleaning up for ${email}...`);
        
        // Delete any team_member entry for this user that points to Naturel
        const { error, data } = await supabase
            .from('team_members')
            .delete()
            .eq('email', email)
            .eq('client_id', NATUREL_CLIENT_ID);
            
        if (error) {
            console.error(`Error deleting Naturel membership for ${email}:`, error);
        } else {
            console.log(`Deleted Naturel membership for ${email}.`);
        }
    }
    
    console.log("Cleanup complete. Users should now have only ONE active membership (Trazzos).");
}

cleanup();
