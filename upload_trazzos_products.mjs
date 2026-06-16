import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const productsToInsert = [
    { name: "Sanitario Gama Premium One-Piece", category: "Baños", price: 0, description: "Sifón oculto, anillo cerrado, asiento de caída lenta. Ideal para baño de revista.", stock: 100 },
    { name: "Sanitario Gama Intermedia One-Piece", category: "Baños", price: 0, description: "Anillo cerrado, caída lenta, sin sifón oculto.", stock: 100 },
    { name: "Sanitario Gama Básica Dos Piezas", category: "Baños", price: 0, description: "Tanque y taza independientes, estilo tradicional.", stock: 100 },
    { name: "Set Accesorios de Baño (Negro)", category: "Baños", price: 0, description: "Diseño moderno en color Negro mate.", stock: 100 },
    { name: "Set Accesorios de Baño (Dorado)", category: "Baños", price: 0, description: "Diseño moderno en color Dorado.", stock: 100 },
    { name: "Espejo Decorativo con Marco", category: "Baños", price: 0, description: "Espejos a medida, redondos o rectangulares.", stock: 100 },
    { name: "Guardaescobas Polipropileno 7cm", category: "Porcelanato", price: 0, description: "Tiras de 2.5m. 100% impermeable y resistente a termitas. Estilo minimalista.", stock: 100 },
    { name: "Guardaescobas Polipropileno 10cm", category: "Porcelanato", price: 0, description: "Tiras de 2.5m. 100% impermeable. Versátil y comercial.", stock: 100 },
    { name: "Estuco Flex Relleno Interior", category: "Pegante", price: 0, description: "Rellena, nivela y corrige imperfecciones profundas en muros.", stock: 100 },
    { name: "Estuco Flex Interior (Pulimiento)", category: "Pegante", price: 0, description: "Textura extra fina, acabado espejo premium. Listo para pintar.", stock: 100 }
];

async function seedProducts() {
    console.log("Fetching Trazzos Client ID...");
    const { data: clients } = await supabase.from('clients').select('id').ilike('name', '%Trazzos%').limit(1);
    
    if (!clients || clients.length === 0) {
        console.error("Trazzos client not found!");
        return;
    }
    
    const clientId = clients[0].id;

    console.log("Uploading products...");
    const payload = productsToInsert.map(p => ({
        ...p,
        client_id: clientId,
        active: true,
        min_stock: 5,
        updated_at: new Date().toISOString()
    }));

    const { error } = await supabase.from('products').insert(payload);
    
    if (error) {
        console.error("Error inserting products:", error);
    } else {
        console.log(`✅ Uploaded ${payload.length} products to Trazzos.`);
    }
}

seedProducts();
