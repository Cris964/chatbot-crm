require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { error } = await supabase.from('clients').update({
    whatsapp_token: 'EAAR8sUWtaiABSHm7wZChn2zpT4TzWHrUNHOInzkdn3IiD0rABvJBvjiKsh6aHAhRlVGTYCLlXvN8ZCxF0wrErcBDs9LBlnaR3Hjd0I9WYcxSOSCbOsAc6FfoDTKKHipWgBRQGaPxmX8vuYMJ1VEZBum0FqhAaEHvTiZAQVzC72qbBMiRTlxJ0lMZBRhy2ADU4WpX6V3JV4ZAFHz3ALpXOJpLevmxJeaIs7jNNniUKFAlACoP01E1s6zqsTZCzA6D7aeNizaW4Arh0mgHBCJ958M2mO3goubLhmKLgZDZD',
    phone_number_id: '1170813859456622'
  }).eq('id', 'c91119cc-5451-4a64-b0e8-6b53d33d5563');
  
  if (error) console.error(error);
  else console.log('Successfully updated Activos token to the new one generated on July 23');
}

main();
