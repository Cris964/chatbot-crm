const fs = require('fs');
let code = fs.readFileSync('src/pages/Inbox.jsx', 'utf8');

// 1. Add aiContextMedia state and ref
if (!code.includes('const [aiContextMedia, setAiContextMedia]')) {
    code = code.replace(
        'const [templateMediaUrl, setTemplateMediaUrl] = useState(\'\')',
        'const [templateMediaUrl, setTemplateMediaUrl] = useState(\'\')\n    const [aiContextMedia, setAiContextMedia] = useState([])\n    const aiContextFileInputRef = useRef(null)'
    );
}

// 2. Add handleAiContextUpload
if (!code.includes('const handleAiContextUpload')) {
    code = code.replace(
        'const handleSendTemplate = async',
        `const handleAiContextUpload = (e) => {
      const files = Array.from(e.target.files);
      if (!files.length) return;
      if (aiContextMedia.length + files.length > 5) {
        alert("Máximo 4 imágenes y 1 video.");
        return;
      }
      const newMedia = files.map(f => ({
        blob: f,
        type: f.type,
        name: f.name
      }));
      setAiContextMedia(prev => [...prev, ...newMedia]);
    };
    
    const handleSendTemplate = async`
    );
}

// 3. Upload logic inside handleSendTemplate
if (!code.includes('let finalAiContextUrls = [];')) {
    code = code.replace(
        'let mediaUrlToSend = templateMediaUrl.trim();',
        `let mediaUrlToSend = templateMediaUrl.trim();
      let finalAiContextUrls = [];`
    );
    
    const uploadLogic = `
        if (aiContextMedia.length > 0) {
            for (const media of aiContextMedia) {
                const base64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(media.blob);
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = error => reject(error);
                });
                const fileName = \`ctx_\${Date.now()}_\${media.name.replace(/[^a-zA-Z0-9.\\-_]/g, '')}\`;
                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ base64, fileName, contentType: media.type })
                });
                const uploadData = await uploadRes.json();
                if (uploadData.publicUrl) finalAiContextUrls.push(uploadData.publicUrl);
            }
        }
    `;
    code = code.replace(
        'const uploadData = await uploadRes.json();\n          if (uploadData.publicUrl) mediaUrlToSend = uploadData.publicUrl;\n        }',
        `const uploadData = await uploadRes.json();\n          if (uploadData.publicUrl) mediaUrlToSend = uploadData.publicUrl;\n        }\n        ${uploadLogic}`
    );
}

// 4. Send the aiContextUrls in the fetch to /api/send
code = code.replace(
    /languageCode: templateLanguage\s*}\)/g,
    'languageCode: templateLanguage,\n               aiContextUrls: finalAiContextUrls\n             })'
);

// 5. Add UI to modal
if (!code.includes('Archivos Adicionales (Fotos IA / Video)')) {
    code = code.replace(
        '<label style={{ fontSize: \'0.8rem\', fontWeight: 600, color: \'var(--text-secondary)\' }}>Archivo de Imagen/Video (Opcional)</label>',
        `<div style={{ marginBottom: 20 }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Archivos Adicionales (Fotos IA / Video)</label>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Sube hasta 4 fotos y 1 video para que el bot responda automáticamente cuando el cliente interactúe.</p>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => aiContextFileInputRef.current?.click()} disabled={aiContextMedia.length >= 5}>
                        <Paperclip size={16} /> Subir Fotos/Video Ocultos
                      </button>
                      <input type="file" ref={aiContextFileInputRef} style={{ display: 'none' }} onChange={handleAiContextUpload} accept="image/*,video/*" multiple />
                      {aiContextMedia.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                          {aiContextMedia.map((media, idx) => (
                            <div key={idx} style={{ position: 'relative', width: '50px', height: '50px', borderRadius: '4px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
                              <img src={URL.createObjectURL(media.blob)} alt={media.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <button type="button" style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', cursor: 'pointer', padding: '2px' }} onClick={() => setAiContextMedia(prev => prev.filter((_, i) => i !== idx))}>
                                <Close size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                   </div>
                   <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Header (Cabecera) de Imagen/Video (Opcional)</label>`
    );
}

// Reset aiContextMedia on modal close
code = code.replace(
    'setShowTemplateModal(false)}><Close size={20} /></button>',
    'setShowTemplateModal(false); setAiContextMedia([]); setTemplateMediaUrl(\'\'); setTemplateMediaFile(null); }><Close size={20} /></button>'
);

fs.writeFileSync('src/pages/Inbox.jsx', code);
console.log('Patched Inbox.jsx with aiContextUrls for template modal');
