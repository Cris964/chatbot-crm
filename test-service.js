const url = "https://zgkwgilghzgtteljfdqv.supabase.co/rest/v1/conversations?select=id,client_id,user_phone,updated_at,user_name&order=updated_at.desc";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpna3dnaWxnaHpndHRlbGpmZHF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYzNjg4NiwiZXhwIjoyMDg4MjEyODg2fQ.BZu3JO7nMQ9rVtf9kUlS9VOX_6IYgPtXqudy3zZLjS4";

fetch(url, {
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`
  }
}).then(r => r.json()).then(d => {
    console.log("Total records directly fetched by Service Role:", d.length);
    d.forEach(x => console.log(`Phone: ${x.user_phone} | Client_ID: ${x.client_id} | Date: ${x.updated_at}`));
}).catch(console.error);
