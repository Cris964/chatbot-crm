import re

with open('src/pages/Inbox.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix max files to 5
content = re.sub(
    r'if \(prev\.length \+ files\.length > 4\) \{.*?return prev;\s*\}',
    "if (prev.length + files.length > 5) {\n            alert('Puedes subir máximo 5 archivos (4 fotos + 1 video).');\n            return prev;\n          }",
    content,
    flags=re.DOTALL
)

# 2. Add accept attr
content = content.replace('accept="image/*"', 'accept="image/*,video/*"')

# 3. Optimistic UI in handleFileUpload (which uses /api/upload in this branch)
match_upload = re.search(r'(const res = await fetch\(\'/api/upload\', \{)', content)
if match_upload:
    idx = match_upload.start()
    before = content[:idx]
    after = content[idx:]
    
    optimistic = """
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
        let tempMsg = null;
        if (mediaType === 'image' || mediaType === 'video') {
            tempMsg = { role: 'agent', content: URL.createObjectURL(file), type: mediaType, timestamp: new Date().toISOString(), isUploading: true };
            setSelectedConv(prev => { if(!prev) return prev; return { ...prev, rawMessages: [...(prev.rawMessages || []), tempMsg] } });
        }
        
"""
    content = before + optimistic + after

# 4. Map includes isUploading
content = content.replace(
    'time: `${dateStr} ${timeStr}`\n        };',
    'time: `${dateStr} ${timeStr}`,\n          isUploading: m.isUploading\n        };'
)

# 5. Opacity in render
content = content.replace(
    "className={`chat-msg-bubble ${m.sender === 'client' ? 'msg-client' : 'msg-agent'}`}",
    "className={`chat-msg-bubble ${m.sender === 'client' ? 'msg-client' : 'msg-agent'}`} style={{ opacity: m.isUploading ? 0.6 : 1 }}"
)

with open('src/pages/Inbox.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
