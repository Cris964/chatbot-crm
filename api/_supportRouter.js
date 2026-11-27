import supportTickets from './_supportTickets.js'
import kanbaWebhook from './_kanbaWebhook.js'

/** Enruta /api/support-tickets y /api/kanba-webhook dentro de /api/webhook
 *  (el plan Hobby limita a 12 funciones, así que no creamos nuevas). */
export default async function routeSubApi(route, req, res) {
  if (route === 'support') return supportTickets(req, res)
  if (route === 'kanba') return kanbaWebhook(req, res)
  res.status(404).json({ error: 'Ruta no encontrada' })
}
