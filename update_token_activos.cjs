require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { error } = await supabase.from('clients').update({
    whatsapp_token: 'EAAR8sUWtaiABSEpuuO8clFMKaTYbVTZAOpHXdFBbJMjupXokXqmXiJMYsrBt8tisyPsdWJDB3FpZAL1suOYSOoYIuTquLB4ZAelHhKDpCGDOYKJDjZAsAbL0qUzGWQHj3z5eDdqYZCphGpBHdxa1BdEOOVZAKPjS7gaOdPnfytw3uknt7OZBwx8VSdWrrNegTYWL0bzWf73jPu9Xlo4ItPEMPcUGUuOKZBz73XnJFaNLLYwJIxfbkXUZCg3AH08IZCDy8cqf3W70UAj9ztTFoPFxfXzC5YNg8lXh5lmgZDZD',
    phone_number_id: '1170813859456622'
  }).eq('id', 'c91119cc-5451-4a64-b0e8-6b53d33d5563');
  
  if (error) console.error(error);
  else console.log('Successfully updated Activo Morrales token and phone number ID to the NEW APP');
}

main();
