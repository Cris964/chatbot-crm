import fetch from 'node-fetch';
import FormData from 'form-data';

export async function processMediaMessage(messageObj, whatsappToken, openAiKey) {
  try {
    const type = messageObj.type;
    let mediaId = null;

    if (type === 'audio' && messageObj.audio) {
      mediaId = messageObj.audio.id;
    } else if (type === 'image' && messageObj.image) {
      mediaId = messageObj.image.id;
    } else if (type === 'video' && messageObj.video) {
      mediaId = messageObj.video.id;
    }

    if (!mediaId) return '[Multimedia no soportado o sin ID]';

    // 1. Get Media URL from Meta Graph API
    const metaResponse = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
      headers: { 'Authorization': `Bearer ${whatsappToken}` }
    });
    
    if (!metaResponse.ok) {
      console.error('[MEDIA] Failed to get media metadata', await metaResponse.text());
      return '[Error al obtener el archivo multimedia]';
    }

    const metaData = await metaResponse.json();
    const mediaUrl = metaData.url;
    const mimeType = metaData.mime_type;

    // 2. Download Media Blob
    let downloadResponse = await fetch(mediaUrl, {
      headers: { 'Authorization': `Bearer ${whatsappToken}` },
      redirect: 'manual'
    });

    if (downloadResponse.status >= 300 && downloadResponse.status < 400) {
      const redirectUrl = downloadResponse.headers.get('location');
      downloadResponse = await fetch(redirectUrl, {
        headers: { 'Authorization': `Bearer ${whatsappToken}` }
      });
    }

    if (!downloadResponse.ok) {
      console.error('[MEDIA] Failed to download media binary', await downloadResponse.text());
      return '[Error al descargar el archivo multimedia]';
    }

    const arrayBuffer = await downloadResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Process based on Type
    if (type === 'audio') {
      if (!openAiKey) return '[Nota de Voz: No hay API Key de OpenAI para transcribir]';
      
      console.log('[MEDIA] Transcribiendo audio con Whisper...');
      const formData = new FormData();
      // Whisper needs a file extension, we map typical whatsapp audio to .ogg or .mp4
      const ext = mimeType.includes('mp4') ? 'mp4' : 'ogg';
      formData.append('file', buffer, { filename: `audio.${ext}`, contentType: mimeType });
      formData.append('model', 'whisper-1');
      formData.append('language', 'es'); // Force Spanish

      const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAiKey}`,
          ...formData.getHeaders()
        },
        body: formData
      });

      if (!whisperResponse.ok) {
        console.error('[MEDIA] Whisper Error', await whisperResponse.text());
        return '[Nota de Voz: Error en la transcripción]';
      }

      const whisperData = await whisperResponse.json();
      return `[Nota de Voz del Cliente]: "${whisperData.text}"`;

    } else if (type === 'image') {
      console.log('[MEDIA] Procesando imagen a Base64...');
      const base64 = buffer.toString('base64');
      const dataUri = `data:${mimeType};base64,${base64}`;
      // In webhook, we will inject this as a special string that gets parsed into an image object
      return `[IMAGEN_BASE64_URL]: ${dataUri}`;
    } else if (type === 'video') {
      return '[Video recibido: Dile al cliente que por ahora no puedes analizar videos, pero que te cuente en texto o nota de voz qué contiene.]';
    }

    return '[Archivo Multimedia]';
  } catch (error) {
    console.error('[MEDIA EXCEPTION]', error);
    return '[Error interno al procesar el archivo multimedia]';
  }
}
