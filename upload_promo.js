const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient('https://zgkwgilghzgtteljfdqv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpna3dnaWxnaHpndHRlbGpmZHF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYzNjg4NiwiZXhwIjoyMDg4MjEyODg2fQ.BZu3JO7nMQ9rVtf9kUlS9VOX_6IYgPtXqudy3zZLjS4');

async function uploadFiles() {
  const filesToUpload = [
    'C:\\Users\\keine\\Downloads\\WhatsApp Video 2026-09-01 at 9.16.11 AM.mp4',
    'C:\\Users\\keine\\.gemini\\antigravity\\brain\\a39665cf-967a-4343-9d90-79f68cabb915\\.user_uploaded\\media_1788362567036.jpg',
    'C:\\Users\\keine\\.gemini\\antigravity\\brain\\a39665cf-967a-4343-9d90-79f68cabb915\\.user_uploaded\\media_1788362567045.jpg',
    'C:\\Users\\keine\\.gemini\\antigravity\\brain\\a39665cf-967a-4343-9d90-79f68cabb915\\.user_uploaded\\media_1788362567150.jpg'
  ];

  const urls = [];

  for (const filePath of filesToUpload) {
    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath);
      return;
    }
    
    const fileExt = path.extname(filePath);
    const fileName = `ctx_${Date.now()}_new_promo${fileExt}`;
    const fileBuffer = fs.readFileSync(filePath);

    console.log(`Uploading ${fileName}...`);
    const { data, error } = await supabase.storage
      .from('whatsapp_media')
      .upload(fileName, fileBuffer, {
        contentType: fileExt === '.mp4' ? 'video/mp4' : 'image/jpeg'
      });

    if (error) {
      console.error('Error uploading', fileName, error);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('whatsapp_media')
      .getPublicUrl(fileName);
      
    urls.push(publicUrlData.publicUrl);
    console.log(`Uploaded! URL: ${publicUrlData.publicUrl}`);
  }

  const finalUrls = urls.join(',');
  console.log('Final URLs string:', finalUrls);

  console.log('Updating PROMO_ACTUAL in products...');
  const { error: updateError } = await supabase
    .from('products')
    .update({ image_url: finalUrls })
    .eq('name', 'PROMO_ACTUAL');

  if (updateError) {
    console.error('Error updating product:', updateError);
  } else {
    console.log('Successfully updated PROMO_ACTUAL with new media!');
  }
}

uploadFiles();
