import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import mime from 'mime-types'; // Note: might not be installed, I'll use a simple extension mapping instead

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const getMimeType = (ext) => {
    ext = ext.toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
    if (ext === '.png') return 'image/png';
    if (ext === '.gif') return 'image/gif';
    if (ext === '.webp') return 'image/webp';
    if (ext === '.mp4') return 'video/mp4';
    return 'application/octet-stream';
};

async function uploadProductsImages() {
    console.log('Starting massive image upload...');
    
    // 1. Get Activo Morrales client id
    const { data: client } = await supabase.from('clients').select('id').ilike('name', '%activo%').single();
    if (!client) {
        console.error('Activo Morrales client not found');
        return;
    }
    const clientId = client.id;
    console.log(`Client ID: ${clientId}`);

    // 2. Fetch all products for Activo Morrales
    const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name')
        .eq('client_id', clientId);
    
    if (productsError) {
        console.error('Error fetching products:', productsError);
        return;
    }
    console.log(`Found ${products.length} products in DB.`);

    const baseDir = 'C:\\Users\\eliza\\Downloads\\Chatboot-20260824T183850Z-1-001\\Chatboot';
    const entries = fs.readdirSync(baseDir, { withFileTypes: true });
    
    let matchCount = 0;
    let notFoundCount = 0;

    for (const entry of entries) {
        const sku = entry.name;
        const dirPath = path.join(baseDir, sku);
        
        if (entry.isDirectory()) {
            // Find product matching this SKU
            // The product name format is usually "SKU - Description" or just "SKU"
            const matchingProduct = products.find(p => {
                const parts = p.name.split('-');
                const pSku = parts[0].trim().toLowerCase();
                return pSku === sku.toLowerCase();
            });

            if (!matchingProduct) {
                console.log(`[!] Product not found for SKU: ${sku}`);
                notFoundCount++;
                continue;
            }

            matchCount++;
            console.log(`[+] Found product for SKU ${sku}: ${matchingProduct.name}`);

            const files = fs.readdirSync(dirPath);
            const uploadedUrls = [];

            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stat = fs.statSync(filePath);
                if (!stat.isFile()) continue;

                const ext = path.extname(file);
                const safeName = file.replace(/[^a-zA-Z0-9.\-_]/g, '');
                const storageName = `products/${sku}_${Date.now()}_${safeName}`;
                
                console.log(`    Uploading ${file}...`);
                const fileBuffer = fs.readFileSync(filePath);
                
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('whatsapp_media')
                    .upload(storageName, fileBuffer, {
                        contentType: getMimeType(ext),
                        upsert: true
                    });

                if (uploadError) {
                    console.error(`    Error uploading ${file}:`, uploadError);
                } else {
                    const { data: publicUrlData } = supabase.storage
                        .from('whatsapp_media')
                        .getPublicUrl(storageName);
                    
                    uploadedUrls.push(publicUrlData.publicUrl);
                    console.log(`    Success: ${publicUrlData.publicUrl}`);
                }
            }

            if (uploadedUrls.length > 0) {
                // Update product image_url
                const imageUrlString = uploadedUrls.join(',');
                console.log(`  -> Updating product ${matchingProduct.id} with ${uploadedUrls.length} images.`);
                const { error: updateError } = await supabase
                    .from('products')
                    .update({ image_url: imageUrlString })
                    .eq('id', matchingProduct.id);
                
                if (updateError) {
                    console.error(`  -> Error updating product:`, updateError);
                }
            } else {
                console.log(`  -> No files uploaded for ${sku}`);
            }
        } else {
            // It's a file at the root, e.g. IMG_0850.jpeg
            // It has no SKU folder, so we don't know which product it belongs to.
            console.log(`[?] Skipping root file: ${sku}`);
        }
    }
    
    console.log(`\nFinished! Matched ${matchCount} SKUs. Not found ${notFoundCount} SKUs.`);
}

uploadProductsImages();
