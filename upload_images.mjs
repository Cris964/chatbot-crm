import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadImages() {
  const dirs = fs.readdirSync('.').filter(f => fs.statSync(f).isDirectory() && f !== 'node_modules' && !f.startsWith('.'));
  
  let imageFiles = [];
  const searchDir = (dir) => {
    try {
      const files = fs.readdirSync(dir);
      for (const f of files) {
        const fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) {
          searchDir(fullPath);
        } else if (f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg') || f.toLowerCase().endsWith('.png') || f.toLowerCase().endsWith('.webp')) {
          imageFiles.push(fullPath);
        }
      }
    } catch(e) {}
  };

  for (const d of dirs) {
    if (d === 'src' || d === 'api' || d === 'dist' || d === 'public') continue;
    searchDir(d);
  }
  
  console.log("Found image files:", imageFiles.length);

  const clientId = '5ac584f8-1d98-4583-9c2c-76a3c3cfe07d';
  const { data: products } = await supabase.from('products').select('id, name, description').eq('client_id', clientId);
  
  for (const imgPath of imageFiles) {
     const filename = path.basename(imgPath);
     let nameWithoutExt = filename.replace(/\.[^/.]+$/, "").trim();
     
     // Find matching product
     let product = products.find(p => p.name.toLowerCase().includes(nameWithoutExt.toLowerCase()) || nameWithoutExt.toLowerCase().includes(p.name.toLowerCase()));
     
     if (!product) {
        console.log(`Creating new product for image: ${nameWithoutExt}`);
        const { data: newProd, error: insertError } = await supabase.from('products').insert([{
           client_id: clientId,
           name: nameWithoutExt,
           description: `Categoría: Grifería / Accesorios.`,
           price: 0,
           stock: 100,
           active: true
        }]).select('id, name, description').single();
        
        if (insertError) {
           console.error("Insert error:", insertError);
           continue;
        }
        product = newProd;
     }
     
     const fileBuffer = fs.readFileSync(imgPath);
     const storagePath = `products/${clientId}/${Date.now()}_${filename.replace(/\\s+/g, '_')}`;
     
     const { error: uploadError } = await supabase.storage.from('whatsapp_media').upload(storagePath, fileBuffer, {
        contentType: imgPath.toLowerCase().endsWith('png') ? 'image/png' : 'image/jpeg',
        upsert: true
     });
     
     if (uploadError) {
        console.error("Upload failed for", filename, uploadError);
        continue;
     }
     
     const publicUrl = `${supabaseUrl}/storage/v1/object/public/whatsapp_media/${storagePath}`;
     
     if (!product.description.includes('[IMG:')) {
        const newDesc = product.description + `\n[IMG: ${publicUrl}]`;
        await supabase.from('products').update({ description: newDesc }).eq('id', product.id);
        console.log(`✅ Uploaded and linked: ${product.name}`);
     }
  }
}

uploadImages();
