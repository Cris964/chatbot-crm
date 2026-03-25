import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function findNaturel() {
    console.log('--- Finding Naturel Client ---');
    const { data: clients, error } = await supabase.from('clients')
        .select('*')
        .ilike('name', '%Naturel%');
    
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Found clients:', clients);
    }
}

findNaturel();
