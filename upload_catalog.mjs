import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.vercel.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const CLIENT_ID = 'c90f532b-0b32-4614-9c21-bbf664213468';
const BASE_DIR = 'C:\\Users\\keine\\Downloads\\Trazzos-20260611T203117Z-3-001\\Trazzos';

async function uploadFile(filePath, fileName, relPath) {
    const fileBuffer = fs.readFileSync(filePath);
    const contentType = mime.lookup(filePath) || 'image/jpeg';
    
    // Normalize path for storage (replace backslashes)
    const storagePath = `catalog/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const { data, error } = await supabase.storage
        .from('product-images')
        .upload(storagePath, fileBuffer, { contentType, upsert: true });

    if (error) {
        console.error(`Failed to upload ${fileName}:`, error.message);
        return null;
    }

    const { data: publicData } = supabase.storage.from('product-images').getPublicUrl(storagePath);
    return publicData.publicUrl;
}

async function start() {
    console.log("Fetching existing products to avoid duplicates...");
    let allExisting = [];
    let page = 0;
    while (true) {
        const { data, error } = await supabase.from('products').select('name').eq('client_id', CLIENT_ID).range(page*1000, (page+1)*1000 - 1);
        if (error || !data || data.length === 0) break;
        allExisting.push(...data);
        page++;
    }
    console.log(`Found ${allExisting.length} existing products.`);

    let addedCount = 0;
    let skippedCount = 0;

    async function processDirectory(dirPath, relativeParts) {
        const items = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const item of items) {
            const fullPath = path.join(dirPath, item.name);
            
            if (item.isDirectory()) {
                await processDirectory(fullPath, [...relativeParts, item.name]);
            } else {
                if (item.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
                    const baseName = item.name.replace(/\.[^/.]+$/, "");
                    
                    // Check if exists
                    // We check if the existing name contains the baseName (or vice versa) to be robust against name cleaning
                    const exists = allExisting.some(p => 
                        p.name.toLowerCase().includes(baseName.toLowerCase()) || 
                        baseName.toLowerCase().includes(p.name.toLowerCase())
                    );

                    if (exists) {
                        console.log(`Skipping existing: ${baseName}`);
                        skippedCount++;
                        continue;
                    }

                    console.log(`Uploading ${item.name}...`);
                    const url = await uploadFile(fullPath, item.name, relativeParts.join('/'));
                    
                    if (url) {
                        // Category is the first folder (e.g. Grifería)
                        const category = relativeParts[0] || 'Catálogo';
                        
                        // The name will be the base filename
                        const productName = baseName;
                        
                        // We put all the rich path information into the description for the AI to search
                        const descriptionTags = relativeParts.join(' | ');
                        const description = `Categoría completa: ${descriptionTags}. Archivo: ${baseName}`;

                        await supabase.from('products').insert([{
                            client_id: CLIENT_ID,
                            name: productName,
                            description: description,
                            price: 0,
                            category: category,
                            active: true,
                            stock: 10,
                            min_stock: 2,
                            image_url: url
                        }]);
                        
                        allExisting.push({ name: productName }); // prevent duplicate uploads of the same file in different formats
                        addedCount++;
                    }
                }
            }
        }
    }

    console.log("Starting catalog upload...");
    await processDirectory(BASE_DIR, []);
    console.log(`Upload complete! Added: ${addedCount}. Skipped: ${skippedCount}.`);
}

start();
