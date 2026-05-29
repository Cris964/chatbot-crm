import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TRAZZOS_ID = 'c90f532b-0b32-4614-9c21-bbf664213468';
const NEW_TOKEN = 'EAASr9DekULIBRVFTMqsGcTHb2e14jlebnzLpl1RGZCkyqMjVzlOKva8XPDYBACkAEakX9fl186KsZCmEW2ingcixuNwmLXQhhUccxJcIdCuy8rZBPANFkWHfMPmqXqOWo0fFuU9g9QkJR8K8wXiT1skH6fGYktvSvkGHzFXCvMXaSmZCPpwM8tTQeNzEhe2HtU5cZBJVPulnKt2IkOfWPmoN7WZB5XTG40IrqHP99M8CNiYHsRX28ZCSYLRTrxFMZBWDUs9HZCQ1HfPZAGOKZB6h3eW480UNHD3dbGXEnxjRNIZD';

async function updateTrazzosToken() {
    console.log("Updating Trazzos Token...");
    
    await supabase.from('clients').update({
        whatsapp_token: NEW_TOKEN,
        active: true
    }).eq('id', TRAZZOS_ID);
    
    console.log("Trazzos token updated successfully.");
}

updateTrazzosToken();
