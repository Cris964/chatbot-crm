import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({path: '.env.vercel.local'});

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function uploadMedia() {
    const videoPath = 'C:\\Users\\keine\\Downloads\\WhatsApp Video 2026-06-15 at 11.24.25 PM.mp4';
    
    try {
        const videoBuffer = fs.readFileSync(videoPath);
        const videoName = `promocion_padre_video_${Date.now()}.mp4`;
        
        const { data, error } = await supabase.storage
            .from('whatsapp_media')
            .upload(videoName, videoBuffer, {
                contentType: 'video/mp4',
                upsert: true
            });
            
        if (error) throw error;
        
        const { data: publicUrlData } = supabase.storage
            .from('whatsapp_media')
            .getPublicUrl(videoName);
            
        console.log('VIDEO URL:', publicUrlData.publicUrl);
    } catch (e) {
        console.error('Error uploading video:', e.message);
    }
}

uploadMedia();
