import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking leads assigned_to...");
  const { data: leads, error: leadErr } = await supabase.from('leads').select('id, assigned_to').limit(1);
  if (leadErr) {
    console.error("Error fetching leads:", leadErr);
  } else {
    console.log("Leads fetch success! Sample:", leads);
  }

  console.log("\nChecking a recent conversation with images...");
  const { data: convs, error: convErr } = await supabase.from('conversations')
    .select('id, messages')
    .limit(10)
    .order('updated_at', { ascending: false });
  
  if (convErr) {
    console.error("Conv error", convErr);
  } else {
    for (const c of convs) {
      if (c.messages) {
        const hasMedia = c.messages.some(m => 
          m.type === 'image' || m.type === 'audio' || 
          (m.content && m.content.includes('[SEND_IMAGE')) ||
          (m.content && m.content.includes('whatsapp_media')) ||
          (m.content && m.content.startsWith('http') && m.content.match(/\.(jpeg|jpg|png|webm|mp3)/))
        );
        if (hasMedia) {
          console.log(`Found conv ${c.id} with media. Sample messages:`);
          console.log(JSON.stringify(c.messages.filter(m => 
            m.type === 'image' || m.type === 'audio' || 
            (m.content && m.content.includes('[SEND_IMAGE')) ||
            (m.content && m.content.includes('whatsapp_media')) ||
            (m.content && m.content.startsWith('http') && m.content.match(/\.(jpeg|jpg|png|webm|mp3)/))
          ), null, 2));
        }
      }
    }
  }

  console.log("\nChecking buckets...");
  const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
  if (bErr) {
    console.error("Bucket error", bErr);
  } else {
    console.log("Buckets:", buckets.map(b => b.name));
  }
}

check();
