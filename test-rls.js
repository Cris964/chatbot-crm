const url = "https://zgkwgilghzgtteljfdqv.supabase.co/rest/v1/conversations?select=id,client_id,user_phone,updated_at,needs_human,channel,user_name&order=updated_at.desc";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpna3dnaWxnaHpndHRlbGpmZHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzY4ODYsImV4cCI6MjA4ODIxMjg4Nn0.qqRN2DJJtYxRmwXkZwobnxQK5hJb3HwEQEVTVPUzTMI"

fetch(url, {
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`
  }
}).then(r => r.json()).then(console.log).catch(console.error);
