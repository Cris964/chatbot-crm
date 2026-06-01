import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zgkwgilghzgtteljfdqv.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpna3dnaWxnaHpndHRlbGpmZHF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYzNjg4NiwiZXhwIjoyMDg4MjEyODg2fQ.BZu3JO7nMQ9rVtf9kUlS9VOX_6IYgPtXqudy3zZLjS4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateCredentials() {
    // New Permanent Token
    const token = "EAAbnQCKABMUBRkUybhZChjZBg1ZAtOan8XFXclprEP6OPpZCZB28s3Uqoke6EjvPgpLZAqRGUQeT3H2v1SwxADLZC73Io5gEylDi9rKIoiGk0ZBNPZAeni34k1Ify5O1Mgu55xiq194I1bKiHEFjPrcu59ieQHqOVIAyV3VPCmhlAs8Yekv7NSs4RXX3F0aDlr4YgIAZDZD";

    console.log("Actualizando credenciales para VitaPlena con TOKEN PERMANENTE...");

    const { data, error } = await supabase
        .from('clients')
        .update({
            whatsapp_token: token
        })
        .eq('name', 'VitaPlena')
        .select();

    if (error) {
        console.error("Error al actualizar:", error.message);
    } else {
        console.log("Credenciales actualizadas exitosamente!");
        console.log("Datos del cliente actualizados:", data[0].whatsapp_token.substring(0, 20) + "...");
    }
}

updateCredentials();
