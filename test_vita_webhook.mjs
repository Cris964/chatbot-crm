import fetch from "node-fetch"; 

async function simulateWebhook() {
    console.log("Simulating incoming message to Vercel Webhook for VitaPlena (Real Number)...");
    
    const payload = {
        object: "whatsapp_business_account",
        entry: [{
            id: "WHATSAPP_BUSINESS_ACCOUNT_ID",
            changes: [{
                value: {
                    messaging_product: "whatsapp",
                    metadata: {
                        display_phone_number: "573045667567",
                        phone_number_id: "1124996354031816" // REAL NUMBER ID
                    },
                    contacts: [{
                        profile: { name: "Test Sim VitaPlena Real" },
                        wa_id: "573163799745"
                    }],
                    messages: [{
                        from: "573163799745",
                        id: "SIM_MESSAGE_" + Date.now(),
                        timestamp: Math.floor(Date.now() / 1000).toString(),
                        text: { body: "Hola, esto es una simulacion con el numero real" },
                        type: "text"
                    }]
                },
                field: "messages"
            }]
        }]
    };

    try {
        const response = await fetch('https://nexuscrmia.vercel.app/api/webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const text = await response.text();
        console.log("Webhook POST Response status:", response.status);
        console.log("Webhook POST Response text:", text);
    } catch (e) {
        console.error("Error connecting to webhook:", e);
    }
}

simulateWebhook();
