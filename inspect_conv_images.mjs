import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase
    .from('conversations')
    .select('id, user_name, messages')
    .eq('user_phone', '573177869408') // Jhon's phone number from the screenshot
    .limit(1);

  if (error) {
    console.error("Error fetching conversation:", error);
    return;
  }
  
  if (data.length === 0) {
    console.log("Jhon's conversation not found.");
    return;
  }

  const conv = data[0];
  console.log("Conversation for:", conv.user_name);
  console.log("Last 5 messages:");
  const last5 = conv.messages.slice(-10);
  last5.forEach((m, idx) => {
    console.log(`[${idx}] role: ${m.role}, type: ${m.type}, content: "${m.content}", media_url: "${m.media_url}"`);
  });
}
run();
