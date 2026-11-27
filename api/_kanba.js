// Puente mínimo con la API v1 de Kanba (app.nexusgrouptec.com).
// Variables de entorno necesarias:
//   KANBA_API_URL  (por defecto https://app.nexusgrouptec.com/api/v1)
//   KANBA_TOKEN    token "CRM Soporte"
//   KANBA_PROJECT  uuid del proyecto «Soporte técnico»
//   KANBA_WEBHOOK_SECRET  secreto del webhook (para validar la firma)

export const KANBA_URL = (process.env.KANBA_API_URL || 'https://app.nexusgrouptec.com/api/v1').replace(/\/$/, '')
export const KANBA_PROJECT = process.env.KANBA_PROJECT || '01m8f52yyhdrpqdp32gmyfak5p'

const PRIORITY_PREFIX = { urgente: '[URGENTE]', alta: '[ALTA]', media: '[MEDIA]', baja: '[BAJA]' }

export async function kanba(path, { method = 'GET', body } = {}) {
  const token = process.env.KANBA_TOKEN
  if (!token) throw new Error('Falta KANBA_TOKEN en el entorno')

  const res = await fetch(`${KANBA_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  const text = await res.text()
  let json = null
  try { json = text ? JSON.parse(text) : null } catch {}

  if (!res.ok) {
    const msg = json?.message || json?.detail || text.slice(0, 200)
    throw new Error(`Kanba ${res.status}: ${msg}`)
  }
  return json
}

export function buildTaskPayload({ title, priority, description, userName, userEmail, clientName }) {
  const prefix = PRIORITY_PREFIX[priority] || PRIORITY_PREFIX.media
  const body = [
    `**Reportado por:** ${userName || 'Usuario del CRM'}`,
    userEmail ? `**Correo:** ${userEmail}` : null,
    clientName ? `**Empresa:** ${clientName}` : null,
    `**Prioridad:** ${(priority || 'media').toUpperCase()}`,
    '',
    '---',
    '',
    description || '(sin descripción)',
  ].filter(Boolean).join('\n')

  return { title: `${prefix} ${title}`.slice(0, 255), description: body }
}

export async function createSupportTask(ticket) {
  const payload = buildTaskPayload(ticket)
  const res = await kanba(`/projects/${KANBA_PROJECT}/tasks`, { method: 'POST', body: payload })
  return res?.data ?? res
}

export async function taskComments(taskId) {
  const res = await kanba(`/tasks/${taskId}/comments`)
  return res?.data ?? []
}

/** Valida la cabecera X-Kanba-Signature: t=<ts>,v1=<hmac_sha256(ts.body, secret)> */
export async function verifyKanbaSignature(rawBody, header, secret) {
  if (!secret) return true // sin secreto configurado no bloqueamos (se avisa en logs)
  if (!header) return false

  const parts = Object.fromEntries(header.split(',').map(p => p.split('=')))
  const ts = parts.t
  const sig = parts.v1
  if (!ts || !sig) return false
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false

  const { createHmac, timingSafeEqual } = await import('node:crypto')
  const expected = createHmac('sha256', secret).update(`${ts}.${rawBody}`).digest('hex')
  const a = Buffer.from(sig, 'utf8')
  const b = Buffer.from(expected, 'utf8')
  return a.length === b.length && timingSafeEqual(a, b)
}
