const fs = require('fs');
let content = fs.readFileSync('src/pages/Inbox.jsx', 'utf8');

// Re-apply max files fix
content = content.replace(/if \(prev\.length \+ files\.length > 4\) \{[\s\S]*?return prev;\s*\}/, 
`if (prev.length + files.length > 5) {
            alert('Puedes subir máximo 5 archivos (4 fotos + 1 video).');
            return prev;
          }`);

content = content.replace(/accept=\"image\/\*\"/g, 'accept=\"image/*,video/*\"');

// Fix handleFileUpload optimistic UI
content = content.replace(/const res = await fetch\('\/api\/upload', \{/,
`// Optimistic UI
        const getMedia = (mt, fn) => {
          if(!mt) mt=''; const m=mt.toLowerCase();
          if(m.startsWith('image/')) return 'image';
          if(m.startsWith('video/')) return 'video';
          if(m.startsWith('audio/')) return 'audio';
          const ext = fn ? fn.split('.').pop().toLowerCase() : '';
          if(['jpg','jpeg','png','gif','webp'].includes(ext)) return 'image';
          if(['mp4','webm','mov'].includes(ext)) return 'video';
          return 'document';
        };
        const mediaType = getMedia(file.type, file.name);
        const tempMsg = { role: 'agent', content: URL.createObjectURL(file), type: mediaType, timestamp: new Date().toISOString(), isUploading: true };
        setSelectedConv(prev => { if(!prev) return prev; return { ...prev, rawMessages: [...(prev.rawMessages || []), tempMsg] } });

        const res = await fetch('/api/upload', {`);

// Fix map to include isUploading
content = content.replace(/time: \`\$\{dateStr\} \$\{timeStr\}\`/g, `time: \`\$\{dateStr\} \$\{timeStr\}\`, isUploading: m.isUploading`);

// Fix opacity
content = content.replace(/className=\{\`chat-msg-bubble \$\{m\.sender === 'client' \? 'msg-client' : 'msg-agent'\}\`\}/g, `className={\`chat-msg-bubble \$\{m.sender === 'client' ? 'msg-client' : 'msg-agent'}\`} style={{ opacity: m.isUploading ? 0.6 : 1 }}`);

fs.writeFileSync('src/pages/Inbox.jsx', content);
