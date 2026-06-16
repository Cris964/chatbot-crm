import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.vercel.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const baseDir = "C:\\Users\\keine\\Downloads\\Trazzos-20260609T224224Z-3-001\\Trazzos\\Grifería";
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
    const rejillasDir = path.join(baseDir, 'Rejillas');
    const accesoriosDir = path.join(baseDir, 'Accesorios de baño');
    
    const allFiles = [...getFiles(rejillasDir), ...getFiles(accesoriosDir)];
    
    for (const file of allFiles) {
        // e.g. Trazzos\Grifería\Rejillas\Rejillas de 10x10\Negras\1.jpg
        const parts = file.split('\\');
        
        let productName = "";
        let category = "Accesorios";
        
        if (file.includes('Rejillas de ')) {
            category = "Rejillas";
            const sizeDir = parts.find(p => p.startsWith('Rejillas de '));
            const colorDir = parts[parts.indexOf(sizeDir) + 1];
            // Format: Rejilla 10x10 Negra
            const size = sizeDir.replace('Rejillas de ', '');
            const color = colorDir.replace(/s$/, '').replace(/as$/, 'a').replace(/os$/, 'o'); // Negras -> Negra, Oro -> Oro
            productName = `Rejilla ${size} ${color}`;
        } else if (file.includes('Accesorios de baño')) {
            category = "Accesorios de Baño";
            // Check color
            const colorDir = parts[parts.length - 2];
            productName = `Set de Accesorios ${colorDir}`;
        }
        
        // Let's add the filename base just in case to differentiate multiple pictures of the same color/size
        const baseName = path.basename(file, path.extname(file));
        if (!['1', '2', '3', '4', 'image', 'foto'].includes(baseName.toLowerCase())) {
            productName += ` ${baseName}`;
        }
        
        console.log(`Uploading: ${productName} (${category})`);
        
        try {
            const publicUrl = await uploadFile(file);
            
            // Upsert by name
            const { data: existing } = await supabase.from('products')
                .select('id, image_url')
                .eq('client_id', clientId)
                .eq('name', productName)
                .single();
                
            if (existing) {
                // append image url if not already there
                let newUrl = existing.image_url;
                if (!newUrl) newUrl = publicUrl;
                else if (!newUrl.includes(publicUrl)) newUrl += ',' + publicUrl;
                
                await supabase.from('products').update({ image_url: newUrl }).eq('id', existing.id);
                console.log(`  🔄 Updated ${productName}`);
            } else {
                await supabase.from('products').insert([{
                    client_id: clientId,
                    name: productName,
                    description: `${category} diseño exclusivo.`,
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
    console.log('Finished uploading Rejillas & Accesorios!');
}

run();
