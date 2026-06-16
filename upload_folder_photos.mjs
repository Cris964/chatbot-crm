import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.vercel.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const baseDir = "C:\\Users\\keine\\Downloads\\Trazzos-20260609T224224Z-3-001";
const clientId = 'c90f532b-0b32-4614-9c21-bbf664213468';

function getWords(str) {
    return str.toLowerCase().replace(/[^a-z0-9ñ]/g, ' ').split(/\s+/).filter(w => w.length > 2);
}

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
          arrayOfFiles.push(path.join(dirPath, file));
      }
    }
  });
  return arrayOfFiles;
}

async function run() {
    console.log("Fetching all products...");
    const { data: products } = await supabase.from('products').select('id, name, category').eq('client_id', clientId);
    
    const allImages = getAllFiles(baseDir);
    
    // Group images by folder
    const folderGroups = {};
    for (const img of allImages) {
        const folderName = path.basename(path.dirname(img));
        if (!folderGroups[folderName]) folderGroups[folderName] = [];
        folderGroups[folderName].push(img);
    }

    let updatedCount = 0;

    for (const [folderName, images] of Object.entries(folderGroups)) {
        const folderWords = getWords(folderName);
        let bestMatch = null;
        let bestScore = 0;
        
        for (const product of products) {
            const prodWords = getWords(product.name);
            let overlap = 0;
            for (const pw of prodWords) {
                if (folderWords.includes(pw)) overlap++;
            }
            if (folderName.toLowerCase().includes(product.name.toLowerCase()) || 
                product.name.toLowerCase().includes(folderName.toLowerCase())) {
                overlap += 10;
            }
            
            // Allow matching against individual filenames if folder match isn't good enough
            let fileOverlap = 0;
            for (const img of images) {
                const fName = path.basename(img, path.extname(img));
                if (fName.toLowerCase().includes(product.name.toLowerCase()) || product.name.toLowerCase().includes(fName.toLowerCase())) {
                    fileOverlap += 5;
                }
            }

            const totalScore = overlap + fileOverlap;
            if (totalScore > bestScore) {
                bestScore = totalScore;
                bestMatch = product;
            }
        }
        
        if (bestScore >= 1 && bestMatch) {
            console.log(`Matched Folder '${folderName}' (${images.length} images) -> Product: ${bestMatch.name} (Score: ${bestScore})`);
            
            const uploadedUrls = [];
            for (const imgPath of images) {
                const ext = path.extname(imgPath);
                const fileBuffer = fs.readFileSync(imgPath);
                const storagePath = `multi_${Date.now()}_${path.basename(imgPath).replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
                
                const { error: uploadErr } = await supabase.storage
                    .from('product-images')
                    .upload(storagePath, fileBuffer, {
                        contentType: ext.toLowerCase() === '.png' ? 'image/png' : (ext.toLowerCase() === '.webp' ? 'image/webp' : 'image/jpeg'),
                        upsert: true
                    });
                    
                if (!uploadErr) {
                    const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(storagePath);
                    uploadedUrls.push(publicUrlData.publicUrl);
                }
            }
            
            if (uploadedUrls.length > 0) {
                // If there are more than 2 images, the webhook handles them correctly.
                await supabase.from('products').update({ image_url: uploadedUrls.join(',') }).eq('id', bestMatch.id);
                updatedCount++;
            }
        }
    }
    
    console.log(`\\n🎉 Updated ${updatedCount} products with MULTIPLE images from folders!`);
}

run().catch(console.error);
