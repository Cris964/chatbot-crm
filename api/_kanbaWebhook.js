// Recibe los webhooks de Kanba (task.completed, task.moved…), actualiza el caso
// en Supabase y crea la notificación para quien lo abrió.

import { createClient } from '@supabase/supabase-js'
import { verifyKanbaSignature, taskComments } from './_kanba.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {})
  const secret = process.env.KANBA_WEBHOOK_SECRET
  const sig = req.headers['x-kanba-signature']

  try {
    const ok = await verifyKanbaSignature(raw, sig, secret)
    if (!ok) {
      console.warn('[KANBA WEBHOOK] firma inválida')
      return res.status(401).json({ error: 'Firma inválida' })
    }
  } catch (e) {
    console.error('[KANBA WEBHOOK] error verificando firma', e)
    return res.status(400).json({ error: 'Firma inválida' })
  }

  let payload = req.body
  if (typeof payload === 'string') { try { payload = JSON.parse(payload) } catch { return res.status(400).json({ error: 'JSON inválido' }) } }

  const event = payload?.event || req.headers['x-kanba-event']
  const task = payload?.data?.task
  if (!event || !task) return res.status(200).json({ ok: true, ignored: 'sin tarea' })

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  )

  const taskId = task.id || task.uuid

  try {
    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('kanba_task_uuid', taskId)
      .maybeSingle()

    if (!ticket) return res.status(200).json({ ok: true, ignored: 'caso no encontrado' })

    if (event === 'task.completed') {
      // última respuesta del equipo = resolución
      let resolution = null
      try {
        const comments = await taskComments(taskId)
        const last = [...(comments || [])].reverse()[0]
        resolution = last?.body || last?.content || null
        if (resolution) {
          await supabase.from('support_ticket_replies')
            .insert([{ ticket_id: ticket.id, author: 'soporte', body: resolution }])
        }
      } catch (e) { /* sin comentarios accesibles */ }

      await supabase.from('support_tickets')
        .update({ status: 'cerrado', resolution, updated_at: new Date().toISOString() })
        .eq('id', ticket.id)

      await supabase.from('notifications').insert([{
        client_id: ticket.client_id,
        user_id: ticket.user_id,
        kind: 'ticket_closed',
        title: `Caso cerrado: ${ticket.title}`,
        body: resolution || 'Tu caso de soporte fue cerrado.',
        link: '/soporte',
      }])

      return res.status(200).json({ ok: true, closed: ticket.id })
    }

    if (event === 'task.reopened') {
      await supabase.from('support_tickets')
        .update({ status: 'abierto', updated_at: new Date().toISOString() })
        .eq('id', ticket.id)
      return res.status(200).json({ ok: true, reopened: ticket.id })
    }

    return res.status(200).json({ ok: true, ignored: event })
  } catch (err) {
    console.error('[KANBA WEBHOOK]', err)
    return res.status(500).json({ error: err.message })
  }
}
