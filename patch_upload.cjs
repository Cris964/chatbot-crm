const fs = require('fs');
let code = fs.readFileSync('src/pages/Inbox.jsx', 'utf8');

const regexUpload = /const base64 = await new Promise\(\(resolve, reject\) => \{[\s\S]*?reader\.onerror = error => reject\(error\);\s*\}\);\s*const fileName = `chat_\$\{Date\.now\(\)\}_\$\{file\.name\.replace\(\/\[\^a-zA-Z0-9\.\\-_\]\/g, ''\)\}`;[\s\S]*?const uploadRes = await fetch\('\/api\/upload', \{[\s\S]*?body: JSON\.stringify\(\{\s*base64,\s*fileName,\s*contentType: file\.type\s*\}\)\s*\}\);[\s\S]*?const uploadData = await uploadRes\.json\(\);\s*if \(uploadData\.publicUrl\) fileUrl = uploadData\.publicUrl;/m;

if (code.match(regexUpload)) {
    code = code.replace(regexUpload, `const fileName = \`chat_\${Date.now()}_\${file.name.replace(/[^a-zA-Z0-9.\\-_]/g, '')}\`;
          
          const { data, error } = await supabase.storage.from('whatsapp_media').upload(fileName, file, { contentType: file.type });
          if (error) throw error;
          
          const { data: pubData } = supabase.storage.from('whatsapp_media').getPublicUrl(fileName);
          if (pubData && pubData.publicUrl) fileUrl = pubData.publicUrl;`);
    console.log('Replaced standard upload');
}

const regexAudio = /const base64 = await new Promise\(\(resolve, reject\) => \{[\s\S]*?reader\.onerror = error => reject\(error\);\s*\}\);\s*const fileName = `audio_\$\{Date\.now\(\)\}\.ogg`;[\s\S]*?const uploadRes = await fetch\('\/api\/upload', \{[\s\S]*?body: JSON\.stringify\(\{\s*base64,\s*fileName,\s*contentType: 'audio\/ogg'\s*\}\)\s*\}\);[\s\S]*?const uploadData = await uploadRes\.json\(\);\s*if \(uploadData\.publicUrl\) audioUrl = uploadData\.publicUrl;/m;

if (code.match(regexAudio)) {
    code = code.replace(regexAudio, `const fileName = \`audio_\${Date.now()}.ogg\`;
          
          const { data, error } = await supabase.storage.from('whatsapp_media').upload(fileName, audioBlob, { contentType: 'audio/ogg' });
          if (error) throw error;
          
          const { data: pubData } = supabase.storage.from('whatsapp_media').getPublicUrl(fileName);
          if (pubData && pubData.publicUrl) audioUrl = pubData.publicUrl;`);
    console.log('Replaced audio upload');
}

const regexTemplate = /const base64 = await new Promise\(\(resolve, reject\) => \{[\s\S]*?reader\.onerror = error => reject\(error\);\s*\}\);\s*const fileName = `template_\$\{Date\.now\(\)\}_\$\{templateMediaFile\.name\.replace\(\/\[\^a-zA-Z0-9\.\\-_\]\/g, ''\)\}`;[\s\S]*?const uploadRes = await fetch\('\/api\/upload', \{[\s\S]*?body: JSON\.stringify\(\{\s*base64,\s*fileName,\s*contentType: templateMediaFile\.type\s*\}\)\s*\}\);[\s\S]*?const uploadData = await uploadRes\.json\(\);\s*if \(uploadData\.publicUrl\) mediaUrlToSend = uploadData\.publicUrl;/m;

if (code.match(regexTemplate)) {
    code = code.replace(regexTemplate, `const fileName = \`template_\${Date.now()}_\${templateMediaFile.name.replace(/[^a-zA-Z0-9.\\-_]/g, '')}\`;
          
          const { data, error } = await supabase.storage.from('whatsapp_media').upload(fileName, templateMediaFile, { contentType: templateMediaFile.type });
          if (error) throw error;
          
          const { data: pubData } = supabase.storage.from('whatsapp_media').getPublicUrl(fileName);
          if (pubData && pubData.publicUrl) mediaUrlToSend = pubData.publicUrl;`);
    console.log('Replaced template upload');
}

fs.writeFileSync('src/pages/Inbox.jsx', code);
