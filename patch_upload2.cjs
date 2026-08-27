const fs = require('fs');
let code = fs.readFileSync('src/pages/Inbox.jsx', 'utf8');

// For Template File
code = code.replace(
    /const uploadRes = await fetch\('\/api\/upload', \{[\s\S]*?body: JSON\.stringify\(\{[\s\S]*?base64,[\s\S]*?fileName,[\s\S]*?contentType: templateMediaFile\.type[\s\S]*?\}\)[\s\S]*?\}\);[\s\S]*?const uploadData = await uploadRes\.json\(\);/m,
    `const { data: dbData, error } = await supabase.storage.from('whatsapp_media').upload(fileName, templateMediaFile, { contentType: templateMediaFile.type });
          if (error) throw error;
          const uploadData = { publicUrl: supabase.storage.from('whatsapp_media').getPublicUrl(fileName).data.publicUrl };`
);

// For Normal File
code = code.replace(
    /const res = await fetch\('\/api\/upload', \{[\s\S]*?body: JSON\.stringify\(\{[\s\S]*?base64,[\s\S]*?fileName,[\s\S]*?contentType: file\.type[\s\S]*?\}\)[\s\S]*?\}\);[\s\S]*?const data = await res\.json\(\);/m,
    `const { data: dbData, error } = await supabase.storage.from('whatsapp_media').upload(fileName, file, { contentType: file.type });
        if (error) throw error;
        const data = { publicUrl: supabase.storage.from('whatsapp_media').getPublicUrl(fileName).data.publicUrl };`
);

// For aiContextUrls in template
code = code.replace(
    /const uploadRes = await fetch\('\/api\/upload', \{[\s\S]*?body: JSON\.stringify\(\{ base64, fileName, contentType: media\.type \}\)[\s\S]*?\}\);[\s\S]*?const uploadData = await uploadRes\.json\(\);/m,
    `const { data: dbData, error } = await supabase.storage.from('whatsapp_media').upload(fileName, media.blob, { contentType: media.type });
                if (error) throw error;
                const uploadData = { publicUrl: supabase.storage.from('whatsapp_media').getPublicUrl(fileName).data.publicUrl };`
);

fs.writeFileSync('src/pages/Inbox.jsx', code);
console.log('Uploads patched');
