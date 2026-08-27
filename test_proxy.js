const url = 'https://wsrv.nl/?url=https://zgkwgilghzgtteljfdqv.supabase.co/storage/v1/object/public/whatsapp_media/trazzos_catalog_v2/Rejilla_10x10_oro_rosa_0.webp&output=jpg';
fetch(url).then(r => console.log('Status:', r.status, 'Content-Type:', r.headers.get('content-type')));
