import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials!");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const baseDir = 'C:\\Users\\eliza\\Desktop\\CRISTIAN\\Trazzos-20260618T164726Z-3-001\\Trazzos';

async function sync() {
    console.log("Starting sync...");
    const { data: clientData, error: clientErr } = await supabase.from('clients').select('id').ilike('name', '%Trazzos%').limit(1).single();
    if (clientErr || !clientData) {
        console.error("Client not found", clientErr);
        return;
    }
    const clientId = clientData.id;
    console.log("Client ID:", clientId);

    const productsToUpsert = [];

    function walk(dir, category, subcats) {
        let files;
        try {
            files = fs.readdirSync(dir);
        } catch (e) {
            console.error("Error reading dir", dir);
            return;
        }
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                if (!category) {
                    walk(fullPath, file, []);
                } else {
                    walk(fullPath, category, [...subcats, file]);
                }
            } else {
                if (file.match(/\.(jpg|jpeg|png|webp)$/i)) {
                    let cleanName = file.replace(/\.(jpg|jpeg|png|webp)$/i, '').replace(/\./g, ' ').replace(/\s+/g, ' ').trim();
                    let description = subcats.join(' ');
                    productsToUpsert.push({
                        name: cleanName,
                        category: category,
                        description: description,
                        localPath: fullPath,
                        filename: file
                    });
                }
            }
        }
    }

    walk(baseDir, null, []);
    console.log(`Found ${productsToUpsert.length} images.`);

    const { data: existingProducts } = await supabase.from('products').select('id, name, image_url').eq('client_id', clientId);
    const existingMap = new Map();
    for(const p of existingProducts) {
        existingMap.set(p.name.toLowerCase().trim(), p.id);
    }

    let inserted = 0;
    let updated = 0;

    for (let i = 0; i < productsToUpsert.length; i++) {
        const p = productsToUpsert[i];
        const lowerName = p.name.toLowerCase().trim();
        
        console.log(`[${i+1}/${productsToUpsert.length}] Processing: ${p.name}`);
        
        const fileExt = p.filename.split('.').pop();
        const storageName = `catalog/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const fileBuffer = fs.readFileSync(p.localPath);
        
        const { data: uploadData, error: uploadErr } = await supabase.storage
            .from('whatsapp_media')
            .upload(storageName, fileBuffer, {
                contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
                upsert: false
            });
            
        if (uploadErr) {
            console.error("  Upload error:", uploadErr.message);
            continue;
        }

        const { data: publicUrlData } = supabase.storage.from('whatsapp_media').getPublicUrl(storageName);
        const imgUrl = publicUrlData.publicUrl;

        const existingId = existingMap.get(lowerName);
        if (existingId) {
            await supabase.from('products').update({
                category: p.category,
                description: p.description,
                image_url: imgUrl,
                status: 'active'
            }).eq('id', existingId);
            updated++;
        } else {
            const { data: newProd } = await supabase.from('products').insert([{
                client_id: clientId,
                name: p.name,
                category: p.category,
                description: p.description,
                price: 0,
                stock: 99,
                image_url: imgUrl,
                status: 'active'
            }]).select('id').single();
            
            if (newProd) {
                existingMap.set(lowerName, newProd.id);
                inserted++;
            }
        }
    }
    console.log(`Sync complete! Inserted: ${inserted}, Updated: ${updated}`);
}

sync().catch(console.error);
