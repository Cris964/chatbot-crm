import fetch from 'node-fetch';

async function test() {
  const url = 'https://zgkwgilghzgtteljfdqv.supabase.co/storage/v1/object/public/product-images/smart_1781134427601_36let5axdlj.jpg';
  const res = await fetch(url);
  console.log("Status:", res.status);
}
test();
