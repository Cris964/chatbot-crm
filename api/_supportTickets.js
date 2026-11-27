// Casos de soporte del CRM. Usa el token de sesión de Supabase del usuario.
// GET  → lista mis casos (con respuestas)
// POST → crea el caso en Kanba y lo guarda en Supabase

import { createClient } from '@supabase/supabase-js'
import { createSupportTask, taskComments } from './_kanba.js'

const admin = () => createClient(
  process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
)

async function currentUser(supabase, req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return null
  const { data, error } = await supabase.auth.getUser(token)
  if (error) return null
  return data.user
}

export default async function handler(req, res) {
  const supabase = admin()

  try {
    const user = await currentUser(supabase, req)
    if (!user) return res.status(401).json({ error: 'Sesión no válida' })

    const { data: member } = await supabase
      .from('team_members')
      .select('client_id, full_name, email, clients(name)')
      .eq('user_id', user.id)
      .maybeSingle()

    const clientId = member?.client_id
    if (!clientId) return res.status(400).json({ error: 'Tu usuario no está vinculado a una empresa' })

    if (req.method === 'GET') {
      const { data: tickets, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      // traer respuestas
      const ids = (tickets || []).map(t => t.id)
      let replies = []
      if (ids.length) {
        const { data: r } = await supabase
          .from('support_ticket_replies')
          .select('*')
          .in('ticket_id', ids)
          .order('created_at', { ascending: true })
        replies = r || []
      }

      // refrescar los que están en Kanba y siguen abiertos
      const refreshed = []
      for (const t of tickets || []) {
        if (t.kanba_task_uuid && t.status !== 'cerrado') {
          try {
            const comments = await taskComments(t.kanba_task_uuid)
            const lastSupport = [...(comments || [])].reverse().find(c => (c.user?.name || '') && true)
            if (lastSupport) {
              const body = lastSupport.body || lastSupport.content || ''
              const already = replies.some(r => r.ticket_id === t.id && r.body === body)
              if (body && !already) {
                const { data: ins } = await supabase.from('support_ticket_replies')
                  .insert([{ ticket_id: t.id, author: 'soporte', body }]).select().single()
                if (ins) replies.push(ins)
              }
            }
          } catch (e) { /* Kanba caído: no bloquea la vista */ }
        }
        refreshed.push(t)
      }

      return res.status(200).json({ tickets: refreshed, replies })
    }

    if (req.method === 'POST') {
      const { title, description, priority, userName } = req.body || {}
      if (!title || !title.trim()) return res.status(400).json({ error: 'El título es obligatorio' })

      const task = await createSupportTask({
        title: title.trim().slice(0, 200),
        description: description || '',
        priority: priority || 'media',
        userName: userName || member?.full_name,
        userEmail: user?.email,
        clientName: member?.clients?.name,
      })

      const taskId = task?.id || task?.uuid || null

      const { data: ticket, error } = await supabase
        .from('support_tickets')
        .insert([{
          client_id: clientId,
          user_id: user.id,
          user_name: userName || member?.full_name || user.email,
          user_email: user.email,
          title: title.trim().slice(0, 200),
          description: description || '',
          priority: priority || 'media',
          status: 'abierto',
          kanba_task_uuid: taskId,
          kanba_url: task?.url || null,
        }])
        .select()
        .single()

      if (error) throw error
      return res.status(201).json({ ticket })
    }

    return res.status(405).json({ error: 'Método no permitido' })
  } catch (err) {
    console.error('[SUPPORT]', err)
    return res.status(500).json({ error: err.message || 'Error creando el caso' })
  }
}
