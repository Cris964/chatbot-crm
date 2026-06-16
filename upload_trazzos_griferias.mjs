import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.vercel.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const CLIENT_ID = 'c90f532b-0b32-4614-9c21-bbf664213468';
const BASE_DIR = "C:\\Users\\keine\\Downloads\\Trazzos-20260609T224224Z-3-001\\Trazzos\\Grifería";

function getContentType(ext) {
    ext = ext.toLowerCase();
    if (ext === '.png') return 'image/png';
    if (ext === '.webp') return 'image/webp';
    if (ext === '.gif') return 'image/gif';
    return 'image/jpeg';
}

function getAllFiles(dirPath, arrayOfFiles) {
    if (!fs.existsSync(dirPath)) return [];
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];
    files.forEach(function(file) {
      const fullPath = path.join(dirPath, file);
      if (fs.statSync(fullPath).isDirectory()) {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      } else {
        if (file.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
            arrayOfFiles.push(fullPath);
        }
      }
    });
    return arrayOfFiles;
}

async function uploadFile(filePath) {
    const ext = path.extname(filePath);
    const fileBuffer = fs.readFileSync(filePath);
    const storagePath = `smart_${Date.now()}_${Math.random().toString(36).slice(2)}_${path.basename(filePath).replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
    
    const { error } = await supabase.storage
        .from('product-images')
        .upload(storagePath, fileBuffer, { contentType: getContentType(ext), upsert: true });
    
    if (error) throw error;
    
    const { data } = supabase.storage.from('product-images').getPublicUrl(storagePath);
    return data.publicUrl;
}

async function run() {
    console.log("Scanning Grifería folders...");
    const files = getAllFiles(BASE_DIR);
    console.log(`Found ${files.length} images.`);

    for (const file of files) {
        const basename = path.basename(file);
        const ext = path.extname(basename);
        let productName = basename.slice(0, -ext.length).trim();
        
        // Skip ambient photos (ending in double dot)
        if (productName.endsWith('.')) continue;

        let category = "Grifería";
        if (file.toLowerCase().includes("lavamanos")) category = "Grifería Lavamanos";
        if (file.toLowerCase().includes("lavaplatos") || file.toLowerCase().includes("cocina")) category = "Grifería Lavaplatos";
        if (file.toLowerCase().includes("ducha")) category = "Torres de Ducha";

        console.log(`Uploading: ${productName} (${category})`);
        
        try {
            const imageUrl = await uploadFile(file);

            // Add to database
            const payload = {
                client_id: CLIENT_ID,
                name: productName.slice(0, 255),
                category: category,
                description: `${category}. Producto importado de excelente calidad y diseño.`,
                price: 0, // Placeholder price so it doesn't offer prices without knowing them, or can we leave it 0?
                stock: 100,
                min_stock: 5,
                active: true,
                image_url: imageUrl,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase.from('products').insert([payload]);
            if (error) {
                console.error(`  DB Error for ${productName}:`, error.message);
            } else {
                console.log(`  ✅ Added ${productName}`);
            }
        } catch (err) {
            console.error(`  Upload Error for ${productName}:`, err.message);
        }
    }
    console.log("Finished uploading griferías!");
}

run().catch(console.error);
