import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });

async function run() {
    const payload = {
        object: "whatsapp_business_account",
        entry: [
            {
                id: "1066063696600554",
                changes: [
                    {
                        value: {
                            messaging_product: "whatsapp",
                            metadata: {
                                display_phone_number: "15551234567",
                                phone_number_id: "1066063696600554"
                            },
                            contacts: [
                                {
                                    profile: { name: "Test User" },
                                    wa_id: "573163799745"
                                }
                            ],
                            messages: [
                                {
                                    from: "573163799745",
                                    id: "wamid.test_image_123",
                                    timestamp: Math.floor(Date.now() / 1000).toString(),
                                    type: "image",
                                    image: {
                                        mime_type: "image/jpeg",
                                        sha256: "fake_sha",
                                        id: "invalid_media_id_so_it_hits_catch",
                                        caption: "Lo tienes disponible?"
                                    }
                                }
                            ]
                        },
                        field: "messages"
                    }
                ]
            }
        ]
    };

    try {
        console.log("Sending payload to webhook...");
        const response = await fetch('https://nexuscrmia.vercel.app/webhook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        console.log("Status:", response.status);
        console.log("Body:", await response.text());
    } catch (e) {
        console.error("Error:", e.message);
    }
}
run();
