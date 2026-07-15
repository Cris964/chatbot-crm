import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const clientId = 'f920ca15-badb-4492-a344-e8d04f9f8c02';

const products = [
  {
    client_id: clientId,
    name: 'Ladrillo Estructural',
    category: 'Estructurales',
    price: 2650,
    stock: 10000,
    active: true,
    promo_text: null,
    image_url: 'https://images.unsplash.com/photo-1595806654942-5cb0f907b22a?q=80&w=600&auto=format&fit=crop',
    description: '12 x 21 x 29 cm | 15 uds/m² | Para muros estructurales y obras civiles.'
  },
  {
    client_id: clientId,
    name: 'Ladrillo M10',
    category: 'Estructurales',
    price: 880,
    stock: 15000,
    active: true,
    promo_text: null,
    image_url: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?q=80&w=600&auto=format&fit=crop',
    description: '10 x 24 x 6.5 cm | 53 uds/m² | Muros divisorios o estructurales ligeros.'
  },
  {
    client_id: clientId,
    name: 'Farol Liso',
    category: 'Fachadas',
    price: 1450,
    stock: 8000,
    active: true,
    promo_text: null,
    image_url: 'https://images.unsplash.com/photo-1533038590840-1c70e28e4e7e?q=80&w=600&auto=format&fit=crop',
    description: '10 x 20 x 30 cm | 15 uds/m² | Para acabados limpios y modernos.'
  },
  {
    client_id: clientId,
    name: 'Farol Rayado',
    category: 'Fachadas',
    price: 1400,
    stock: 12000,
    active: true,
    promo_text: null,
    image_url: 'https://images.unsplash.com/photo-1559132204-63cb53526154?q=80&w=600&auto=format&fit=crop',
    description: '10 x 20 x 30 cm | 15 uds/m² | Para fachadas llamativas con textura.'
  },
  {
    client_id: clientId,
    name: 'Farol 3 Huecos Liso',
    category: 'Fachadas',
    price: 1350,
    stock: 7500,
    active: true,
    promo_text: null,
    image_url: 'https://images.unsplash.com/photo-1523412702580-c13f6311deac?q=80&w=600&auto=format&fit=crop',
    description: '30 x 8 x 20 cm | 15 uds/m² | Para ventilación natural.'
  },
  {
    client_id: clientId,
    name: 'Bloquelón',
    category: 'Entrepisos',
    price: 4400,
    stock: 5000,
    active: true,
    promo_text: null,
    image_url: 'https://images.unsplash.com/photo-1574738596646-f6d2b3803d5d?q=80&w=600&auto=format&fit=crop',
    description: '80 x 8 x 23 cm | 5 uds/m² | Para entrepisos y losas.'
  }
];

async function insertProducts() {
  await supabase.from('products').delete().eq('client_id', clientId);
  const { data, error } = await supabase.from('products').insert(products);
  if (error) console.error('Error inserting products:', error);
  else console.log('Products inserted successfully.');
}

insertProducts();
