import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.vercel.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const CLIENT_ID = 'f920ca15-badb-4492-a344-e8d04f9f8c02';
const BUCKET = 'product-images';

const imageMap = {
    'Farol 3 Huecos': 'WhatsApp Image 2026-05-27 at 8.42.45 PM.jpeg',
    'Farol Rayado': 'WhatsApp Image 2026-05-27 at 8.42.46 PM.jpeg',
    'Farol Liso': 'WhatsApp Image 2026-05-27 at 8.42.45 PM (1).jpeg',
    'Estructural Grande': 'WhatsApp Image 2026-05-27 at 8.42.46 PM (1).jpeg',
    'M10': 'WhatsApp Image 2026-05-27 at 8.42.46 PM (2).jpeg',
    'Estructural': 'WhatsApp Image 2026-05-27 at 8.42.47 PM.jpeg',
    'Boquelón': 'WhatsApp Image 2026-05-27 at 8.42.47 PM (1).jpeg',
    'Ladrillo Común': 'WhatsApp Image 2026-05-27 at 8.42.45 PM (2).jpeg'
};

const BASE_DIR = 'C:\\Users\\keine\\Downloads\\La Samaritana';

async function run() {
    console.log('Uploading La Samaritana images...');
    
    for (const [productName, fileName] of Object.entries(imageMap)) {
        const filePath = path.join(BASE_DIR, fileName);
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            continue;
        }

        const fileData = fs.readFileSync(filePath);
        const storagePath = `samaritana/${fileName.replace(/[^a-zA-Z0-9.\-]/g, '_')}`;

        console.log(`Uploading ${productName} -> ${storagePath}`);
        
        const { data: uploadData, error: uploadErr } = await supabase.storage
            .from(BUCKET)
            .upload(storagePath, fileData, {
                contentType: 'image/jpeg',
                upsert: true
            });

        if (uploadErr) {
            console.error(`Error uploading ${fileName}:`, uploadErr);
            continue;
        }

        const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
        const imageUrl = publicUrlData.publicUrl;

        console.log(`Updating product ${productName} with URL: ${imageUrl}`);
        const { error: dbErr } = await supabase.from('products')
            .update({ image_url: imageUrl })
            .eq('client_id', CLIENT_ID)
            .eq('name', productName);

        if (dbErr) {
            console.error(`Error updating product ${productName}:`, dbErr);
        } else {
            console.log(`✅ Success for ${productName}`);
        }
    }
    
    console.log('Finished uploading all images!');
}

run().catch(console.error);
