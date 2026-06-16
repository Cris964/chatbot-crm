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

function getWords(str) {
    return str.toLowerCase().replace(/[^a-z0-9ñáéíóú]/g, ' ').split(/\s+/).filter(w => w.length > 2);
}

function getContentType(ext) {
    ext = ext.toLowerCase();
    if (ext === '.png') return 'image/png';
    if (ext === '.webp') return 'image/webp';
    if (ext === '.gif') return 'image/gif';
    return 'image/jpeg';
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
    console.log("Fetching all products...");
    const { data: products } = await supabase.from('products').select('id, name').eq('client_id', clientId);
    
    const allFiles = getAllFiles(baseDir);
    
    // Separate into product shots (no double dot) and ambient shots (double dot before extension)
    // Pattern: filename..ext = ambient, filename.ext = product
    const productShots = {}; // key = normalized name, value = path
    const ambientShots = {}; // key = normalized name, value = path
    
    for (const filePath of allFiles) {
        const basename = path.basename(filePath);
        const ext = path.extname(basename);
        const nameWithoutExt = basename.slice(0, -ext.length);
        
        const isAmbient = nameWithoutExt.endsWith('.');
        const cleanName = isAmbient ? nameWithoutExt.slice(0, -1) : nameWithoutExt;
        const normalizedName = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        if (isAmbient) {
            ambientShots[normalizedName] = filePath;
        } else {
            productShots[normalizedName] = filePath;
        }
    }
    
    console.log(`Found ${Object.keys(productShots).length} product shots and ${Object.keys(ambientShots).length} ambient shots`);
    
    let updated = 0;
    
    for (const product of products) {
        const prodWords = getWords(product.name);
        let bestProductShot = null;
        let bestAmbientShot = null;
        let bestScore = 0;
        
        for (const [key, filePath] of Object.entries(productShots)) {
            const fileWords = getWords(key);
            let overlap = 0;
            for (const pw of prodWords) {
                if (fileWords.includes(pw) || key.includes(pw)) overlap++;
            }
            if (key.includes(product.name.toLowerCase().replace(/[^a-z0-9]/g, ''))) overlap += 10;
            
            if (overlap > bestScore) {
                bestScore = overlap;
                bestProductShot = filePath;
                // Look for matching ambient shot
                const ambientMatch = ambientShots[key] || null;
                bestAmbientShot = ambientMatch;
            }
        }
        
        if (bestScore >= 2 && bestProductShot) {
            console.log(`\n✅ ${product.name} -> Score:${bestScore}`);
            console.log(`   Product: ${path.basename(bestProductShot)}`);
            console.log(`   Ambient: ${bestAmbientShot ? path.basename(bestAmbientShot) : 'none'}`);
            
            try {
                const urls = [];
                const productUrl = await uploadFile(bestProductShot);
                urls.push(productUrl);
                
                if (bestAmbientShot) {
                    await new Promise(r => setTimeout(r, 300));
                    const ambientUrl = await uploadFile(bestAmbientShot);
                    urls.push(ambientUrl);
                }
                
                await supabase.from('products').update({ image_url: urls.join(',') }).eq('id', product.id);
                updated++;
            } catch (e) {
                console.error(`   Error: ${e.message}`);
            }
        }
    }
    
    console.log(`\n\n🎉 Updated ${updated} products with proper product + ambient photo pairing!`);
}

run().catch(console.error);
