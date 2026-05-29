async function simulateWebhook() {
    console.log("Simulating incoming message to Vercel Webhook...");
    
    const payload = {
        object: "whatsapp_business_account",
        entry: [{
            id: "WHATSAPP_BUSINESS_ACCOUNT_ID",
            changes: [{
                value: {
                    messaging_product: "whatsapp",
                    metadata: {
                        display_phone_number: "15556397704",
                        phone_number_id: "1033194656544690" // Using Naturel ID which we know works
                    },
                    contacts: [{
                        profile: { name: "Test Sim" },
                        wa_id: "573163799745"
                    }],
                    messages: [{
                        from: "573163799745",
                        id: "SIM_MESSAGE_" + Date.now(),
                        timestamp: Math.floor(Date.now() / 1000).toString(),
                        text: { body: "Hola, esto es una prueba de fuego" },
                        type: "text"
                    }]
                },
                field: "messages"
            }]
        }]
    };

    const response = await fetch('https://nexuscrmia.vercel.app/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const text = await response.text();
    console.log("Webhook POST Response:", text);
}

simulateWebhook();
