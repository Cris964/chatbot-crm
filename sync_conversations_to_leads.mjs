/**
 * sync_conversations_to_leads.mjs
 * Toma todas las conversaciones existentes y las convierte en leads automáticamente
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncConversationsToLeads() {
  console.log("🔄 Sincronizando conversaciones a leads...\n");

  // 1. Obtener todas las conversaciones con client_id
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('id, client_id, user_phone, user_name, updated_at')
    .not('client_id', 'is', null);

  if (error) {
    console.error("❌ Error al obtener conversaciones:", error.message);
    return;
  }

  console.log(`📊 ${conversations.length} conversaciones encontradas.\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const conv of conversations) {
    if (!conv.user_phone || !conv.client_id) {
      skipped++;
      continue;
    }

    // Buscar si ya existe un lead para este teléfono + client
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('client_id', conv.client_id)
      .eq('phone', conv.user_phone)
      .maybeSingle();

    if (existingLead) {
      // Actualizar nombre si hace falta
      await supabase.from('leads').update({ 
        name: conv.user_name || 'Cliente WhatsApp' 
      }).eq('id', existingLead.id);
      updated++;
      console.log(`  ↻ Actualizado: ${conv.user_name} (${conv.user_phone})`);
    } else {
      // Crear nuevo lead
      const { error: insertError } = await supabase.from('leads').insert([{
        client_id: conv.client_id,
        phone: conv.user_phone,
        name: conv.user_name || 'Cliente WhatsApp',
        stage: 'Contactado',
        score: 10,
        source: 'WhatsApp',
        value: '$0',
        status: 'active'
      }]);

      if (insertError) {
        console.error(`  ❌ Error al crear lead para ${conv.user_phone}:`, insertError.message);
        skipped++;
      } else {
        created++;
        console.log(`  ✅ Creado: ${conv.user_name || 'Sin nombre'} (${conv.user_phone})`);
      }
    }
  }

  console.log(`\n✅ Sincronización completada:`);
  console.log(`   - ${created} leads creados`);
  console.log(`   - ${updated} leads actualizados`);
  console.log(`   - ${skipped} omitidos`);
}

syncConversationsToLeads().catch(console.error);
