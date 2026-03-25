import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testInsert() {
    console.log('--- Testing Insert to Orders ---');
    const dummy = {
        client_id: '98b9fafd-90ad-4ed9-9616-b8ed992b0e7d',
        user_phone: '573163799745',
        user_name: 'Test Debug',
        product: 'CX-P',
        status: 'pendiente'
    };

    console.log('Attempting simple insert...');
    const { error: err1 } = await supabase.from('orders').insert(dummy);
    if (err1) {
        console.error('Simple insert FAILED:', err1.message);
    } else {
        console.log('Simple insert SUCCESS!');
    }

    console.log('\nAttempting full insert (with city/address)...');
    const full = {
        ...dummy,
        city: 'Cali',
        address: 'Test Addr',
        total: 100,
        items: [{name: 'Test'}]
    };
    const { error: err2 } = await supabase.from('orders').insert(full);
    if (err2) {
        console.error('Full insert FAILED:', err2.message);
    } else {
        console.log('Full insert SUCCESS!');
    }
}

testInsert();
