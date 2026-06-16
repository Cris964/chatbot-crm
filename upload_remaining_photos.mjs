import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.vercel.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
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

function getWords(str) {
    return str.toLowerCase().replace(/[^a-z0-9ñ]/g, ' ').split(/\s+/).filter(w => w.length > 2);
}

async function run() {
    console.log("1. Fetching products WITHOUT images...");
    const { data: products } = await supabase.from('products')
        .select('id, name, image_url')
        .eq('client_id', clientId)
        .is('image_url', null); // Only missing ones
    
    console.log(`Found ${products.length} products needing images.`);
    
    const allImages = getAllFiles(baseDir);
    
    let matchCount = 0;
    
    for (const product of products) {
        const prodWords = getWords(product.name);
        
        let bestMatch = null;
        let bestScore = 0;
        
        for (const imagePath of allImages) {
            const fileName = path.basename(imagePath, path.extname(imagePath));
            const fileWords = getWords(fileName);
            
            // Count intersection
            let overlap = 0;
            for (const pw of prodWords) {
                if (fileWords.includes(pw)) overlap++;
            }
            
            // Give extra weight if it matches exactly as a substring
            if (fileName.toLowerCase().includes(product.name.toLowerCase()) || 
                product.name.toLowerCase().includes(fileName.toLowerCase())) {
                overlap += 10;
            }
            
            if (overlap > bestScore) {
                bestScore = overlap;
                bestMatch = imagePath;
            }
        }
        
        // If we found at least 1 matching significant word (or 2 if the product has many words)
        if (bestScore >= 1 && bestMatch) {
            console.log(`Fuzzy Match: [Product] '${product.name}' -> [File] '${path.basename(bestMatch)}' (Score: ${bestScore})`);
            
            const ext = path.extname(bestMatch);
            const fileBuffer = fs.readFileSync(bestMatch);
            const storagePath = `fuzzy_${Date.now()}_${path.basename(bestMatch).replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
            
            const { error: uploadErr } = await supabase.storage
                .from('product-images')
                .upload(storagePath, fileBuffer, {
                    contentType: ext.toLowerCase() === '.png' ? 'image/png' : 'image/jpeg',
                    upsert: true
                });
                
            if (uploadErr) {
                console.error("Error uploading:", uploadErr);
                continue;
            }
            
            const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(storagePath);
            await supabase.from('products').update({ image_url: publicUrlData.publicUrl }).eq('id', product.id);
            
            matchCount++;
        }
    }
    
    console.log(`\n🎉 Uploaded ${matchCount} more photos using fuzzy matching!`);
}

run().catch(console.error);
