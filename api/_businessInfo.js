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

Cómo responder:
- Dirección, ubicación o cómo llegar: comparte la dirección tal cual, sin agregar barrios ni referencias que no estén aquí.
- «¿Cuál es el horario?»: lista el horario completo (o el del día si lo especifican). No hace falta decir si está abierto ahora.
- «¿Están abiertos ahora?», «¿a qué hora abren/cierran?»: usa la FECHA Y HORA ACTUAL (Bogotá) y calcula la próxima apertura real (domingo → lunes 8:00 a. m.; lunes después de las 6:00 p. m. → martes 8:00 a. m.; sábado después de la 1:00 p. m. → lunes 8:00 a. m.). Indica que está cerrado y cuándo vuelve a abrir.
- No compartas teléfonos ni números de contacto: la atención es por este mismo chat.
- No agregues etiquetas como [NEEDS_HUMAN] para responder sobre dirección u horarios: son datos que ya tienes y no requieren un asesor.
`
}
