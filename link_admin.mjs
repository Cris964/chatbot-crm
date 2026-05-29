import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function linkUsers() {
    console.log("Linking users...");
    // 1. Get the first client
    const { data: client, error: clientErr } = await supabase.from('clients').select('id').limit(1).maybeSingle();
    if (!client) {
        console.error("No client found!");
        return;
    }
    console.log("Found client:", client.id);

    // 2. Get all users
    const { data: users, error: userErr } = await supabase.auth.admin.listUsers();
    if (userErr) {
        console.error("Error fetching users:", userErr);
        return;
    }

    for (const u of users.users) {
        // 3. Upsert into team_members
        const { error: tmErr } = await supabase.from('team_members').upsert({
            user_id: u.id,
            client_id: client.id,
            role: 'admin',
            full_name: 'Admin',
            email: u.email,
            status: 'activo'
        }, { onConflict: 'user_id, client_id' });
        
        if (tmErr) {
            console.error("Error linking user:", u.email, tmErr);
        } else {
            console.log("Linked user:", u.email);
        }
    }
    console.log("Done.");
}

linkUsers();
