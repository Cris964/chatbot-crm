import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.vercel.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const CLIENT_ID = 'c90f532b-0b32-4614-9c21-bbf664213468';

const baseDir = 'C:\\Users\\keine\\Downloads\\Trazzos-20260609T224224Z-3-001\\Trazzos\\Sanitarios';

async function uploadFile(filePath, fileName) {
    const fileBuffer = fs.readFileSync(filePath);
    const contentType = mime.lookup(filePath) || 'image/jpeg';
    const cleanName = `sanitarios/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const { data, error } = await supabase.storage
        .from('product-images')
        .upload(cleanName, fileBuffer, { contentType, upsert: true });

    if (error) {
        console.error(`Failed to upload ${fileName}:`, error.message);
        return null;
    }

    const { data: publicData } = supabase.storage.from('product-images').getPublicUrl(cleanName);
    return publicData.publicUrl;
}

async function processDirectory(dirPath, category) {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const item of items) {
        const fullPath = path.join(dirPath, item.name);
        if (item.isDirectory()) {
            await processDirectory(fullPath, `${category}/${item.name}`);
        } else {
            if (item.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
                console.log(`Uploading ${item.name}...`);
                const url = await uploadFile(fullPath, item.name);
                
                if (url) {
                    const productName = item.name.replace(/\.[^/.]+$/, "");
                    console.log(`Inserting product ${productName}...`);
                    await supabase.from('products').insert([{
                        client_id: CLIENT_ID,
                        name: productName,
                        description: `Sanitario ${productName}`,
                        price: 0,
                        category: `Sanitarios - ${category}`,
                        active: true,
                        stock: 10,
                        min_stock: 2,
                        image_url: url
                    }]);
                }
            }
        }
    }
}

async function start() {
    console.log("Starting sanitarios upload...");
    await processDirectory(baseDir, 'General');
    console.log("Upload complete!");
}

start();
