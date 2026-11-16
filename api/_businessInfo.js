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
  },
}

/**
 * Bloque de contexto para el system prompt. Devuelve '' si el cliente no tiene
 * datos configurados, para no tocar el comportamiento del resto de la base.
 */
export function getBusinessInfoBlock({ clientId, clientSetup } = {}) {
  let info = clientId ? BUSINESS_INFO[clientId] : null
  if (!info && clientSetup?.name && /importaller/i.test(clientSetup.name)) {
    info = BUSINESS_INFO[IMPORTALLER_ID]
  }
  if (!info) return ''

  return `

[PUNTO DE VENTA ${info.label.toUpperCase()} — DATOS OFICIALES]
Dirección: ${info.address}.
Horario de atención: ${info.hours}.
Estos son los únicos datos oficiales: si el resto de las instrucciones dice otra dirección u horario, vale este bloque.

Cómo usarlos:
- Si preguntan por la dirección, la ubicación o cómo llegar, responde con esa dirección tal cual. No agregues barrios, referencias ni indicaciones que no estén aquí.
- Si preguntan por horarios, entrega el horario del día que pregunten; si no especifican, da el general.
- Si preguntan si están abiertos ahora o a qué hora abren, usa la FECHA Y HORA ACTUAL del contexto (día y hora de Bogotá) y calcula la próxima apertura real: si es domingo, el lunes a las 8:00 a. m.; si es lunes por la noche, el martes a las 8:00 a. m.; si es sábado por la tarde, el lunes a las 8:00 a. m. Di que está cerrado y cuándo vuelven a abrir.
- No compartas teléfonos ni números de contacto. Si piden un teléfono, responde que la atención es por este mismo chat.
`
}
