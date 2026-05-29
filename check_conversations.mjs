import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const s = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
s.from('conversations').select('*').order('updated_at', { ascending: false }).limit(5).then(r => console.dir(r.data, {depth: null}));
