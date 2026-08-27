const fs = require('fs');

const fixLists = () => {
    let code = fs.readFileSync('src/pages/Lists.jsx', 'utf8');

    code = code.replace(
        /const base64 = await new Promise\(\(resolve, reject\) => \{[\s\S]*?reader\.onerror = error => reject\(error\);\s*\}\);\s*const uploadRes = await fetch\('\/api\/upload', \{[\s\S]*?body: JSON\.stringify\(\{ base64, fileName, contentType: pendingMedia\.type \}\)[\s\S]*?\}\);[\s\S]*?const uploadData = await uploadRes\.json\(\);\s*if \(uploadData\.publicUrl\) \{/m,
        `const { data: dbData, error } = await supabase.storage.from('whatsapp_media').upload(fileName, pendingMedia.blob, { contentType: pendingMedia.type });
          if (error) throw error;
          const uploadData = { publicUrl: supabase.storage.from('whatsapp_media').getPublicUrl(fileName).data.publicUrl };
          if (uploadData.publicUrl) {`
    );

    code = code.replace(
        /const base64 = await new Promise\(\(resolve, reject\) => \{[\s\S]*?reader\.onerror = error => reject\(error\);\s*\}\);\s*const uploadRes = await fetch\('\/api\/upload', \{[\s\S]*?body: JSON\.stringify\(\{ base64, fileName, contentType: media\.type \}\)[\s\S]*?\}\);[\s\S]*?const uploadData = await uploadRes\.json\(\);\s*if \(uploadData\.publicUrl\) aiContextUrls\.push\(uploadData\.publicUrl\);/m,
        `const { data: dbData, error } = await supabase.storage.from('whatsapp_media').upload(fileName, media.blob, { contentType: media.type });
              if (error) throw error;
              const uploadData = { publicUrl: supabase.storage.from('whatsapp_media').getPublicUrl(fileName).data.publicUrl };
              if (uploadData.publicUrl) aiContextUrls.push(uploadData.publicUrl);`
    );

    fs.writeFileSync('src/pages/Lists.jsx', code);
    console.log('Lists.jsx patched');
};

fixLists();
