import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);
const BUCKET_NAME = 'whatsapp_media';
const UPLOAD_BASE_DIR = 'trazzos_catalog_v2';
const SOURCE_DIR = 'C:\\Users\\eliza\\Downloads\\Trazzos-20260701T125455Z-3-001\\Trazzos';

function getCleanName(filename) {
    let name = filename.replace(/\.(png|jpe?g|webp|gif|bmp)$/i, '');
    name = name.replace(/\(\d+\)/g, '').trim();
    name = name.replace(/\.+$/, '').trim();
    return name;
}

function walkDir(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            walkDir(filePath, fileList);
        } else {
            fileList.push(filePath);
        }
    }
    return fileList;
}

async function run() {
    console.log('Fetching Trazzos client_id...');
    const { data: clientData, error: clientError } = await supabase.from('clients').select('id').eq('name', 'Trazzos').single();
    if (clientError || !clientData) {
        console.error('Error fetching client:', clientError);
        return;
    }
    const clientId = clientData.id;
    console.log(`Found Trazzos client_id: ${clientId}`);

    console.log(`Reading directory: ${SOURCE_DIR}`);
    const files = walkDir(SOURCE_DIR);
    
    // Group files by base name
    const groupedProducts = {};
    for (const file of files) {
        const ext = path.extname(file);
        if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext.toLowerCase())) continue;
        
        const filename = path.basename(file);
        const relativePath = path.relative(SOURCE_DIR, file);
        const folderName = path.dirname(relativePath).replace(/\\/g, ' - ');
        const cleanName = getCleanName(filename);
        
        if (!groupedProducts[cleanName]) {
            groupedProducts[cleanName] = {
                name: cleanName,
                category: folderName,
                files: []
            };
        }
        groupedProducts[cleanName].files.push(file);
    }

    const totalProducts = Object.keys(groupedProducts).length;
    console.log(`Found ${totalProducts} unique products across ${files.length} images.`);

    // Upload to storage
    const uploadedProducts = [];
    let count = 0;
    for (const [name, data] of Object.entries(groupedProducts)) {
        count++;
        console.log(`[${count}/${totalProducts}] Processing: ${name}`);
        const uploadedUrls = [];
        for (let i = 0; i < data.files.length; i++) {
            const localFile = data.files[i];
            const ext = path.extname(localFile);
            // create a safe storage name
            const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
            const storagePath = `${UPLOAD_BASE_DIR}/${safeName}_${i}${ext}`;
            
            const fileContent = fs.readFileSync(localFile);
            const contentType = mime.lookup(localFile) || 'application/octet-stream';
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(storagePath, fileContent, { contentType, upsert: true });
                
            if (uploadError) {
                console.error(`  -> Upload error for ${localFile}:`, uploadError);
            } else {
                const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
                uploadedUrls.push(publicUrlData.publicUrl);
            }
        }
        
        if (uploadedUrls.length > 0) {
            uploadedProducts.push({
                client_id: clientId,
                name: name,
                category: data.category,
                description: data.category,
                image_url: uploadedUrls.join(', '),
                price: 0,
                active: true,
                stock: 999
            });
        }
    }
    
    console.log(`Finished uploads. Preparing to insert ${uploadedProducts.length} products to database.`);
    
    // Delete old products
    console.log('Deleting old Trazzos products...');
    const { error: delError } = await supabase.from('products').delete().eq('client_id', clientId);
    if (delError) {
        console.error('Error deleting old products:', delError);
        return;
    }
    
    // Insert new products
    console.log('Inserting new products...');
    const { error: insertError } = await supabase.from('products').insert(uploadedProducts);
    if (insertError) {
        console.error('Error inserting new products:', insertError);
    } else {
        console.log('Successfully inserted all new products!');
    }
}

run();
