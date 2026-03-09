// pages/api/send-whatsapp.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const { clientId, userPhone, message } = req.body
    if (!clientId || !userPhone || !message) {
      return res.status(400).json({ error: 'Faltan campos' })
    }
    const { error } = await supabase.from('outbox').insert({
      client_id: clientId,
      user_phone: userPhone,
      message: message,
      status: 'pending',
      created_at: new Date().toISOString()
    })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
