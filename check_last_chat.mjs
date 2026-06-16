import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://zgkwgilghzgtteljfdqv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpna3dnaWxnaHpndHRlbGpmZHF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYzNjg4NiwiZXhwIjoyMDg4MjEyODg2fQ.BZu3JO7nMQ9rVtf9kUlS9VOX_6IYgPtXqudy3zZLjS4";

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: convs, error } = await supabase
    .from('conversations')
    .select('id, user_name, messages, updated_at')
    .order('updated_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error(error);
    return;
  }

  for (const c of convs) {
    console.log(`\nChat ID: ${c.id} - User: ${c.user_name} - Updated: ${c.updated_at}`);
    const msgs = c.messages || [];
    const lastMsgs = msgs.slice(-3);
    for (const m of lastMsgs) {
      console.log(`[${m.role}] ${m.content}`);
    }
  }
}
check();
