import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const filePath = 'C:\\Users\\keine\\Downloads\\WhatsApp Image 2026-06-12 at 2.22.47 PM.jpeg';
    
    if (!fs.existsSync(filePath)) {
        console.error("File not found:", filePath);
        return;
    }
    
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = 'trazzos_fachada.jpeg';
    
    console.log("Uploading...");
    const { data, error } = await supabase.storage
        .from('whatsapp_media')
        .upload(fileName, fileBuffer, {
            contentType: 'image/jpeg',
            upsert: true
        });
        
    if (error) {
        console.error("Error uploading:", error);
    } else {
        console.log("Uploaded successfully:", data);
        const { data: publicUrlData } = supabase.storage.from('whatsapp_media').getPublicUrl(fileName);
        console.log("Public URL:", publicUrlData.publicUrl);
    }
}
run();
