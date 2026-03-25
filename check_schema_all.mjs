import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkSchema() {
    console.log('--- Checking Orders Columns ---');
    const { data: o } = await supabase.from('orders').select('*').limit(1);
    if (o && o.length > 0) console.log('Orders columns:', Object.keys(o[0]));

    console.log('\n--- Checking Leads Columns ---');
    const { data: l } = await supabase.from('leads').select('*').limit(1);
    if (l && l.length > 0) console.log('Leads columns:', Object.keys(l[0]));
    
    console.log('\n--- Checking Conversations Columns ---');
    const { data: c } = await supabase.from('conversations').select('*').limit(1);
    if (c && c.length > 0) console.log('Convs columns:', Object.keys(c[0]));
}

checkSchema();
