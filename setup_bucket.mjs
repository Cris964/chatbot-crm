import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env.vercel.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupBucket() {
  const { data, error } = await supabase.storage.getBucket('whatsapp_media');
  if (error && error.message.includes('not found')) {
    console.log("Bucket not found, creating 'whatsapp_media'...");
    const { data: newBucket, error: createError } = await supabase.storage.createBucket('whatsapp_media', {
      public: true,
      allowedMimeTypes: ['image/*', 'audio/*', 'video/*'],
      fileSizeLimit: 10485760 // 10MB
    });
    if (createError) {
      console.error("Failed to create bucket:", createError);
    } else {
      console.log("Bucket created successfully:", newBucket);
    }
  } else if (error) {
    console.error("Error checking bucket:", error);
  } else {
    console.log("Bucket already exists:", data.name);
    // Ensure it's public
    await supabase.storage.updateBucket('whatsapp_media', { public: true });
    console.log("Bucket is set to public.");
  }
}

setupBucket();
