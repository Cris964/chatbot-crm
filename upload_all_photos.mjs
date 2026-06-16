import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.vercel.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const baseDir = "C:\\Users\\keine\\Downloads\\Trazzos-20260609T224224Z-3-001";
const clientId = 'c90f532b-0b32-4614-9c21-bbf664213468';

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
          arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

async function run() {
    console.log("1. Fetching all products for client...");
    const { data: products, error: pErr } = await supabase.from('products').select('id, name').eq('client_id', clientId);
    if (pErr) throw pErr;
    
    console.log(`Found ${products.length} products in DB.`);
    
    console.log("2. Scanning directory for images...");
    const allImages = getAllFiles(baseDir);
    console.log(`Found ${allImages.length} images in folder.`);
    
    let matchCount = 0;
    
    for (const imagePath of allImages) {
        const ext = path.extname(imagePath);
        let fileName = path.basename(imagePath, ext).trim();
        // Remove weird characters or suffixes if needed, maybe just lowercase comparison
        const cleanFileName = fileName.toLowerCase().replace(/_/g, ' ');
        
        // Find matching product
        const matchedProduct = products.find(p => p.name.toLowerCase() === cleanFileName || p.name.toLowerCase().includes(cleanFileName));
        
        if (matchedProduct) {
            console.log(`Match found: File '${fileName}' -> Product '${matchedProduct.name}'`);
            
            // Upload to Supabase Storage
            const fileBuffer = fs.readFileSync(imagePath);
            const storagePath = `${Date.now()}_${path.basename(imagePath).replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
            
            const { data: uploadData, error: uploadErr } = await supabase.storage
                .from('product-images')
                .upload(storagePath, fileBuffer, {
                    contentType: ext === '.png' ? 'image/png' : 'image/jpeg',
                    upsert: true
                });
                
            if (uploadErr) {
                console.error("Error uploading image:", uploadErr);
                continue;
            }
            
            const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(storagePath);
            const publicUrl = publicUrlData.publicUrl;
            
            // Update product
            await supabase.from('products').update({ image_url: publicUrl }).eq('id', matchedProduct.id);
            console.log(`   ✅ Updated product with image URL.`);
            matchCount++;
        } else {
            console.log(`❌ No match found for file: '${fileName}'`);
        }
    }
    
    console.log(`\n🎉 Process finished! Matched and uploaded ${matchCount} images out of ${allImages.length}.`);
}

run().catch(console.error);
