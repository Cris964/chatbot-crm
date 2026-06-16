import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function importExcel() {
    console.log("Fetching Trazzos Client ID...");
    const clientId = 'c90f532b-0b32-4614-9c21-bbf664213468';
    const wrongClientId = '5ac584f8-1d98-4583-9c2c-76a3c3cfe07d';

    // Delete mistakenly added products from the wrong client
    console.log("Cleaning up wrong client products...");
    await supabase.from('products').delete().eq('client_id', wrongClientId).eq('price', 0);

    // Delete previous placeholders (price = 0)
    console.log("Deleting old placeholders...");
    await supabase.from('products').delete().eq('client_id', clientId).eq('price', 0);

    const wb = XLSX.readFile('C:\\Users\\keine\\Downloads\\Listado de productos Entrenamiento IA.xlsx');
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

    const productsToInsert = [];
    let currentCategory = 'Otro';

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        if (!row || row.length === 0) continue; // Empty row

        // Category Header (usually 1 element, or multiple but first is a long string)
        if (row.length === 1 || (typeof row[0] === 'string' && row[0].toLowerCase().includes('marca'))) {
            currentCategory = row[0];
            continue;
        }

        // Skip table headers
        if (typeof row[0] === 'string' && row[0].toLowerCase().includes('rerefe')) {
            continue;
        }

        // It's a product!
        const ref = row[0];
        const format = row[1];
        const m2 = row[2];
        const units = row[3];

        if (!ref) continue;

        let description = "";
        if (format) description += `Formato: ${format}. `;
        if (m2) description += `M2 x caja: ${m2}. `;
        if (units) description += `Unidades x caja: ${units}.`;

        productsToInsert.push({
            name: ref.toString(),
            category: currentCategory.slice(0, 50), // Cap category length
            description: description.trim() + `\n(Tipo: ${currentCategory})`,
            price: 0,
            stock: 100,
            min_stock: 10,
            active: true,
            client_id: clientId,
            updated_at: new Date().toISOString()
        });
    }

    console.log(`Found ${productsToInsert.length} products to insert.`);
    
    if (productsToInsert.length > 0) {
        // Insert in batches of 50 to avoid payload limits
        const batchSize = 50;
        for (let i = 0; i < productsToInsert.length; i += batchSize) {
            const batch = productsToInsert.slice(i, i + batchSize);
            const { error } = await supabase.from('products').insert(batch);
            if (error) {
                console.error("Error inserting batch:", error);
            } else {
                console.log(`Inserted batch ${i/batchSize + 1}`);
            }
        }
        console.log("✅ Import complete!");
    } else {
        console.log("No products found.");
    }
}

importExcel();
