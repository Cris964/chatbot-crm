import { createClient } from '@supabase/supabase-js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  try {
    const { base64, fileName, contentType } = req.body;
    if (!base64 || !fileName) return res.status(400).json({ error: 'Missing file data' });

    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Convert base64 back to buffer
    const base64Data = base64.replace(/^data:([A-Za-z-+/]+);base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const { data, error } = await supabase.storage
      .from('whatsapp_media')
      .upload(fileName, buffer, {
        contentType: contentType || 'application/octet-stream',
        upsert: true
      });
      
    if (error) {
      console.error('[API UPLOAD] Storage error:', error);
      return res.status(500).json({ error: error.message });
    }

    const { data: publicUrlData } = supabase.storage.from('whatsapp_media').getPublicUrl(fileName);
    
    return res.status(200).json({ url: publicUrlData.publicUrl });
  } catch (err) {
    console.error('[API UPLOAD] Server error:', err);
    return res.status(500).json({ error: err.message });
  }
}
