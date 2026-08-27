import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function updateToken() {
    const newToken = "EAAPcRjSEhaUBSdNQHv0yLpEJLFTZBSsHZCwXLZAfZASvE2fhPulxZCoUoE36os4Y7ZCDjxNKg2yi0tTHJfdfLoYKqJtwPL7hTdqoZCNBF0j6S8RPfbxTZB2LbxAH2nglCzQfmFCeKgLZBGloG0pJqzUSQcZC7Ndoi5gZAEcEZB0SxXOFvBcXDHZCIqZCj0y62M1QpZAbLruKKJgJV5LbNBZBVDRpsXgxgZARrxKHfatiHQcM6LBAOazNcLSjZCHho3qrhpcZCfRzBXdE9Qrfd4550mMmgBkdPMRgHl6PoZCS0N0bBUcZD";
    
    const { data, error } = await supabase
        .from('clients')
        .update({ whatsapp_token: newToken })
        .eq('name', 'Importaller');
        
    if (error) {
        console.error("Error updating token:", error);
    } else {
        console.log("Token updated successfully!");
    }
}

updateToken();
