import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.vercel.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const baseDir = "C:\\Users\\keine\\Downloads\\Trazzos-20260609T224224Z-3-001\\Trazzos";
const clientId = 'c90f532b-0b32-4614-9c21-bbf664213468';

function getFiles(dir, files = []) {
    if (!fs.existsSync(dir)) return files;
    const fileList = fs.readdirSync(dir);
    for (const file of fileList) {
        const name = `${dir}\\${file}`;
        if (fs.statSync(name).isDirectory()) {
            getFiles(name, files);
        } else if (name.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
            files.push(name);
        }
    }
    return files;
}

async function uploadFile(fullPath) {
    const filename = path.basename(fullPath);
    const ext = path.extname(filename);
    const uniqueName = `smart_${Date.now()}_${Math.random().toString(36).substring(2,15)}${ext}`;
    const fileBuffer = fs.readFileSync(fullPath);
    
    const { data, error } = await supabase.storage.from('product-images').upload(uniqueName, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true
    });
    if (error) throw error;
    
    const { data: publicData } = supabase.storage.from('product-images').getPublicUrl(uniqueName);
    return publicData.publicUrl;
}

async function run() {
    const dirsToProcess = [
        path.join(baseDir, 'Lavamanos'),
        path.join(baseDir, 'Revestimientos-Enchapes'),
        path.join(baseDir, 'Sanitarios')
    ];
    
    let allFiles = [];
    for (const d of dirsToProcess) {
        allFiles = [...allFiles, ...getFiles(d)];
    }
    
    for (const file of allFiles) {
        const parts = file.split('\\');
        
        let productName = "";
        let category = "General";
        
        // Lavamanos/Mueble suspendido 40 cm/Gris Claro/1.jpg -> "Lavamanos Mueble suspendido 40 cm Gris Claro"
        // Revestimientos-Enchapes/Porcelanatos/60x120/Carrara/1.jpg -> "Porcelanato 60x120 Carrara"
        // Sanitarios/One Piece/Blanco/1.jpg -> "Sanitario One Piece Blanco"
        
        if (file.includes('Revestimientos-Enchapes')) {
            category = "Revestimientos";
            const typeIndex = parts.findIndex(p => p === 'Revestimientos-Enchapes') + 1;
            const type = parts[typeIndex]; // e.g. Porcelanatos, Ceramicas
            const size = parts[typeIndex + 1]; // e.g. 60x120
            const style = parts[typeIndex + 2]; // e.g. Carrara, Madera
            
            if (size && style && !style.includes('.jpg')) {
                productName = `${type.replace(/s$/, '')} ${size} ${style}`;
            } else {
                productName = `${type.replace(/s$/, '')} ${size || style || path.basename(file, path.extname(file))}`;
            }
        } else if (file.includes('Sanitarios')) {
            category = "Sanitarios";
            const typeIndex = parts.findIndex(p => p === 'Sanitarios') + 1;
            const type = parts[typeIndex]; // e.g. One Piece, Combo
            const style = parts[typeIndex + 1]; // e.g. Blanco, Negro
            if (style && !style.includes('.jpg')) {
                productName = `Sanitario ${type} ${style}`;
            } else {
                productName = `Sanitario ${type || path.basename(file, path.extname(file))}`;
            }
        } else if (file.includes('Lavamanos')) {
            category = "Lavamanos";
            const typeIndex = parts.findIndex(p => p === 'Lavamanos') + 1;
            const type = parts[typeIndex];
            const style = parts[typeIndex + 1];
            if (style && !style.includes('.jpg')) {
                productName = `Lavamanos ${type} ${style}`;
            } else {
                productName = `Lavamanos ${type || path.basename(file, path.extname(file))}`;
            }
        }
        
        // Append base filename if it's not a generic number
        const baseName = path.basename(file, path.extname(file));
        if (!['1', '2', '3', '4', 'image', 'foto', 'a', 'b', 'c', 'd'].includes(baseName.toLowerCase())) {
            productName += ` ${baseName}`;
        }
        
        console.log(`Uploading: ${productName} (${category})`);
        
        try {
            const publicUrl = await uploadFile(file);
            
            const { data: existing } = await supabase.from('products')
                .select('id, image_url')
                .eq('client_id', clientId)
                .eq('name', productName)
                .single();
                
            if (existing) {
                let newUrl = existing.image_url;
                if (!newUrl) newUrl = publicUrl;
                else if (!newUrl.includes(publicUrl)) newUrl += ',' + publicUrl;
                
                await supabase.from('products').update({ image_url: newUrl }).eq('id', existing.id);
                console.log(`  🔄 Updated ${productName}`);
            } else {
                await supabase.from('products').insert([{
                    client_id: clientId,
                    name: productName,
                    description: `${category} de alta calidad Trazzos.`,
                    price: 0,
                    category: category,
                    active: true,
                    image_url: publicUrl
                }]);
                console.log(`  ✅ Added ${productName}`);
            }
        } catch(e) {
            console.error(`Error with ${file}`, e);
        }
    }
    console.log('Finished uploading Revestimientos, Sanitarios and Lavamanos!');
}

run();
