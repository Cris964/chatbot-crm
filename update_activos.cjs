require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { error } = await supabase.from('clients').update({
    whatsapp_token: 'EAAaOc5He5rgBSFtYNx9nCl7ZBV594wha1ZCwwd811J0TefD4KMZCOQZBNTc4Sw0McYbZB8E15xx3OYpNshV0lFz1sCcjlJ8QkBul1YEwgBwU0kT1wiZCZC6TnJM9xtOiKLuTdZA3c9qgoZCUcLbIAQe0jCOkBZB0NoVSu9i9qEVCo6fmjuu24tuQcWVq2PKLT1YVXcXCwZCSILYTZBoHrVzBKQWyRJpBIniKHcqeLKCaN6IsWevpxZCNtC8DoT5hZCei6ZAhdHuIlYwZC6ZC8HitTkQgzLbZB4oLlyGmESrgSDRVEZD',
    phone_number_id: '1131600676705092'
  }).eq('id', 'c91119cc-5451-4a64-b0e8-6b53d33d5563');
  
  if (error) console.error(error);
  else console.log('Successfully updated Activo Morrales credentials');
}

main();
