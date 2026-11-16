// Datos oficiales del punto de venta que la IA puede entregar al cliente.
//
// Vive en código (y no en clients.prompt) porque ese campo solo lo puede editar
// un administrador del workspace y hoy la cuenta admin de Importaller está
// inactiva. Si más adelante se mueve a la base, este es el contenido a cargar.

const IMPORTALLER_ID = '281db48e-b43b-4399-8d7d-d629fe936944'

const BUSINESS_INFO = {
  [IMPORTALLER_ID]: {
    label: 'Importaller',
    address: 'Cra. 1 #24-70, Comuna 3, Cali, Valle del Cauca',
    hours: 'lunes a viernes de 8:00 a. m. a 12:00 del mediodía y de 2:00 p. m. a 6:00 p. m.; sábados de 8:00 a. m. a 1:00 p. m.; domingos cerrado',
    // Franjas de atención por día (0 = domingo). Colombia no tiene horario de verano.
    schedule: {
      0: [],
      1: [[8, 12], [14, 18]],
      2: [[8, 12], [14, 18]],
      3: [[8, 12], [14, 18]],
      4: [[8, 12], [14, 18]],
      5: [[8, 12], [14, 18]],
      6: [[8, 13]],
    },
  },
}

const BOGOTA_OFFSET_MS = -5 * 60 * 60 * 1000

// Día y hora actuales en Bogotá, sin depender de la zona del servidor.
function bogotaNow(date = new Date()) {
  const shifted = new Date(date.getTime() + BOGOTA_OFFSET_MS)
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
    minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  }
}

const hourLabel = (h) => (h < 12 ? `${h}:00 a. m.` : h === 12 ? '12:00 del mediodía' : `${h - 12}:00 p. m.`)

// Estado actual y próxima apertura, calculados acá para que el modelo no tenga
// que hacer aritmética de días (se equivocaba al nombrar el día).
function openState(info, now) {
  const slots = info.schedule?.[now.weekday] || []
  const abierto = slots.some(([desde, hasta]) => now.minutes >= desde * 60 && now.minutes < hasta * 60)

  for (let d = 0; d < 8; d += 1) {
    const dia = new Date(Date.UTC(now.year, now.month, now.day + d))
    const franjas = info.schedule?.[dia.getUTCDay()] || []
    for (const [h] of franjas) {
      if (d === 0 && h * 60 <= now.minutes) continue
      const diaTexto = dia.toLocaleDateString('es-CO', {
        weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
      })
      const relativo = d === 0 ? 'hoy' : d === 1 ? 'mañana' : 'el'
      const diaParte = d === 0 ? `hoy, ${diaTexto},` : `${relativo} ${diaTexto},`
      return { abierto, proxima: `${diaParte} a las ${hourLabel(h)}` }
    }
  }
  return { abierto, proxima: '' }
}

/**
 * Bloque de contexto para el system prompt. Devuelve '' si el cliente no tiene
 * datos configurados, para no tocar el comportamiento del resto de la base.
 */
export function getBusinessInfoBlock({ clientId, clientSetup, now } = {}) {
  let info = clientId ? BUSINESS_INFO[clientId] : null
  if (!info && clientSetup?.name && /importaller/i.test(clientSetup.name)) {
    info = BUSINESS_INFO[IMPORTALLER_ID]
  }
  if (!info) return ''

  const estado = openState(info, bogotaNow(now))

  return `

[PUNTO DE VENTA ${info.label.toUpperCase()} — DATOS OFICIALES]
Dirección: ${info.address}.
Horario de atención: ${info.hours}.
Estado en este momento (ya calculado; no lo recalcules): ${estado.abierto ? 'abierto ahora' : 'cerrado ahora'}; próxima apertura: ${estado.proxima}
Estos son los únicos datos oficiales: si el resto de las instrucciones dice otra dirección u horario, vale este bloque.

Cómo responder:
- Dirección, ubicación o cómo llegar: comparte la dirección tal cual, sin agregar barrios ni referencias que no estén aquí.
- «¿Cuál es el horario?»: lista el horario completo (o el del día si lo especifican). No hace falta decir si está abierto ahora.
- «¿Están abiertos ahora?», «¿a qué hora abren/cierran?», «¿puedo ir hoy?»: contesta en una frase natural con esos datos, sin recalcular el día y sin copiar la línea del estado tal cual. Ejemplo del tono (adáptalo al tuyo): «Ahora estamos cerrados; volvemos a abrir mañana martes 17 de noviembre a las 8:00 a. m.».
- No compartas teléfonos ni números de contacto: la atención es por este mismo chat.
- No agregues etiquetas como [NEEDS_HUMAN] para responder sobre dirección u horarios: son datos que ya tienes y no requieren un asesor.
`
}
