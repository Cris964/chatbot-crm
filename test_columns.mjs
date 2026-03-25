import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testInsert() {
    console.log('--- Testing specific columns ---');
    const base = { client_id: '98b9fafd-90ad-4ed9-9616-b8ed992b0e7d', user_phone: '573163799745', user_name: 'Test', product: 'CX-P', status: 'pendiente' };
    
    const columns = ['city', 'address', 'total', 'created_at', 'client_id'];
    for (const col of columns) {
        if (col === 'client_id') continue;
        const msg = { ...base };
        msg[col] = (col === 'total') ? 0 : 'test';
        const { error } = await supabase.from('orders').insert(msg);
        if (error) {
            console.log(`❌ Column '${col}' FAILED: ${error.message}`);
        } else {
            console.log(`✅ Column '${col}' SUCCESS!`);
        }
    }
}

testInsert();
