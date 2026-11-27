export async function processMediaMessage(messageObj, whatsappToken, openAiKey, supabase, phoneNumberId, options = {}) {
  try {
    const type = messageObj.type;
    let mediaId = null;

    if (type === 'audio' && messageObj.audio) {
      mediaId = messageObj.audio.id;
    } else if (type === 'image' && messageObj.image) {
      mediaId = messageObj.image.id;
    } else if (type === 'video' && messageObj.video) {
      mediaId = messageObj.video.id;
    } else if (type === 'voice' && messageObj.voice) {
      mediaId = messageObj.voice.id;
    } else if (type === 'document' && messageObj.document) {
      mediaId = messageObj.document.id;
    }

    if (type === 'reaction' && messageObj.reaction) {
      return `[El cliente reaccionó con el emoji: ${messageObj.reaction.emoji}]`;
    }

    if (!mediaId) return `[Multimedia no soportado. Tipo: ${type}]`;

    // 1. Get Media URL from Meta Graph API
    let metaUrl = `https://graph.facebook.com/v21.0/${mediaId}`;
    if (phoneNumberId) {
      metaUrl += `?phone_number_id=${phoneNumberId}`;
    }
    const metaRes = await fetch(metaUrl, {
      headers: { Authorization: `Bearer ${whatsappToken}` }
    });

    if (!metaRes.ok) {
      const txt = await metaRes.text();
      return `[Error al obtener media URL: ${metaRes.status} ${txt.slice(0, 200)}]`;
    }

    const metaData = await metaRes.json();
    const mediaUrl = metaData.url;
    const mimeType = metaData.mime_type || 'application/octet-stream';

    if (!mediaUrl) return `[Meta no devolvió URL para media ID ${mediaId}]`;

    // 2. Download Media — follow redirect manually
    let dlRes = await fetch(mediaUrl, {
      headers: { Authorization: `Bearer ${whatsappToken}` },
      redirect: 'follow'
    });

    if (!dlRes.ok) {
      return `[Error al descargar media: ${dlRes.status}]`;
    }

    const arrayBuffer = await dlRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Process based on type
    if (type === 'audio' || type === 'voice') {
      const finalOpenAiKey = openAiKey || process.env.OPENAI_API_KEY;
      const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'ogg';
      const fileName = `${Date.now()}-${mediaId}.${ext}`;

      // El audio se sube SIEMPRE para que el asesor pueda escucharlo en el CRM.
      let audioUrl = null;
      try {
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('whatsapp_media')
          .upload(fileName, buffer, { contentType: mimeType, upsert: true });
        if (!uploadErr && uploadData) {
          const { data: publicUrlData } = supabase.storage.from('whatsapp_media').getPublicUrl(fileName);
          audioUrl = publicUrlData.publicUrl;
        }
      } catch (err) {
        console.error('Error uploading audio:', err);
      }

      // Solo se transcribe si la IA va a responder, si hay clave y si no es enorme.
      const tooBig = buffer.length > 2500000;
      const shouldTranscribe = options.transcribe !== false && !tooBig && !!finalOpenAiKey;
      if (!shouldTranscribe) {
        if (tooBig) console.log(`[WHISPER] omitido por tamaño: ${Math.round(buffer.length / 1024)} KB`);
        return { text: '🎙 Nota de voz', mediaUrl: audioUrl, mediaType: 'audio' };
      }

      const blob = new Blob([buffer], { type: mimeType });
      const formData = new FormData();
      formData.append('file', blob, `audio.${ext}`);
      formData.append('model', 'whisper-1');
      formData.append('language', 'es');

      const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${finalOpenAiKey}` },
        body: formData
      });

      if (!whisperRes.ok) {
        const e = await whisperRes.text();
        console.error(`[WHISPER] ${whisperRes.status}: ${e.slice(0, 200)}`);
        return { text: '🎙 Nota de voz', mediaUrl: audioUrl, mediaType: 'audio' };
      }

      const whisperData = await whisperRes.json();
      return { text: `"${whisperData.text}"`, mediaUrl: audioUrl, mediaType: 'audio' };

    } else if (type === 'image') {
      const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpeg';
      const fileName = `${Date.now()}-${mediaId}.${ext}`;
      let imageUrl = null;
      try {
        const { data: uploadData, error: uploadErr } = await supabase.storage.from('whatsapp_media').upload(fileName, buffer, {
           contentType: mimeType,
           upsert: true
        });
        if (!uploadErr && uploadData) {
           const { data: publicUrlData } = supabase.storage.from('whatsapp_media').getPublicUrl(fileName);
           imageUrl = publicUrlData.publicUrl;
        }
      } catch (err) {
        console.error("Error uploading image to supabase storage:", err);
      }
      
      const caption = messageObj.image?.caption || '';
      return {
          text: caption || '📷 Imagen recibida',
          mediaUrl: imageUrl,
          mediaType: 'image'
      };

    } else if (type === 'video') {
      const ext = mimeType.includes('mp4') ? 'mp4' : 'mp4';
      const fileName = `${Date.now()}-${mediaId}.${ext}`;
      let videoUrl = null;
      try {
        const { data: uploadData, error: uploadErr } = await supabase.storage.from('whatsapp_media').upload(fileName, buffer, {
           contentType: mimeType,
           upsert: true
        });
        if (!uploadErr && uploadData) {
           const { data: publicUrlData } = supabase.storage.from('whatsapp_media').getPublicUrl(fileName);
           videoUrl = publicUrlData.publicUrl;
        }
      } catch (err) {
        console.error("Error uploading video to supabase storage:", err);
      }
      
      const caption = messageObj.video?.caption || '';
      return {
          text: (caption ? caption + '\n\n' : '') + '[Video recibido: Pídele al cliente que describa en texto o nota de voz lo que contiene.]',
          mediaUrl: videoUrl,
          mediaType: 'video'
      };

    } else if (type === 'document') {
      let ext = 'pdf';
      if (mimeType.includes('pdf')) ext = 'pdf';
      else if (mimeType.includes('word')) ext = 'docx';
      else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) ext = 'xlsx';
      
      const fileName = `${Date.now()}-${mediaId}.${ext}`;
      let docUrl = null;
      try {
        const { data: uploadData, error: uploadErr } = await supabase.storage.from('whatsapp_media').upload(fileName, buffer, {
           contentType: mimeType,
           upsert: true
        });
        if (!uploadErr && uploadData) {
           const { data: publicUrlData } = supabase.storage.from('whatsapp_media').getPublicUrl(fileName);
           docUrl = publicUrlData.publicUrl;
        }
      } catch (err) {
        console.error('Error uploading document to supabase storage:', err);
      }
      
      const caption = messageObj.document?.caption || '';
      const docName = messageObj.document?.filename || 'Documento adjunto';
      return {
          text: (caption ? caption + '\n\n' : '') + '[Documento recibido: ' + docName + ']',
          mediaUrl: docUrl,
          mediaType: 'document'
      };
    }
    
    return `[Archivo Multimedia tipo ${type}]`;
  } catch (err) {
    return `[EXCEPCION MEDIA]: ${err.message}`;
  }
}
