import fs from 'fs';
async function test() {
    const res = await fetch('https://zgkwgilghzgtteljfdqv.supabase.co/storage/v1/object/public/whatsapp_media/1787581503785-2008008339879958.jpeg');
    const buf = Buffer.from(await res.arrayBuffer());
    console.log(buf.slice(0, 10).toString('hex'));
}
test();
