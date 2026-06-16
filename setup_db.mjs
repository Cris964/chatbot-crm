import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({path: '.env.vercel.local'});

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function setup() {
  const { error } = await supabase.rpc('execute_sql', {
    sql_query: `
      CREATE TABLE IF NOT EXISTS campaign_leads (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        calendly_status TEXT DEFAULT 'invited',
        next_reminder_at TIMESTAMPTZ,
        appointment_date TIMESTAMPTZ,
        reminders_sent INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  });
  if (error) {
     console.log('Error creating table via RPC, checking if maybe the table already exists or another error...', error);
  } else {
     console.log('Table campaign_leads setup query executed.');
  }
}
setup();
