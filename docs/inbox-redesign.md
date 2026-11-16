# Rediseño del Inbox — especificación de implementación

Estado: **terminado**. Burbujas claras (PR #14) y etiquetas bajo el nombre (PR #15) ya estaban en
producción; las cuatro secciones que faltaban del mockup aprobado (`informe/mockup-inbox.html`) están
implementadas y verificadas contra la bandeja real.

## Archivos implicados

- `src/pages/Inbox.jsx` (~3.300 líneas, concentra casi todo).
- `src/styles/nexus-ui.css` (tema claro; al final están los bloques nuevos del rediseño).
- Mocks de referencia: `informe/mockup-inbox.html`.

## Clases reales del DOM

- Contenedor de mensajes: `.chat-messages`
- Burbuja: `.chat-msg-bubble` con `.msg-client` (cliente) y `.msg-agent` (asesor).
- Cabecera: `.chat-header` con `.chat-head-id`, `.chat-head-name`, `.chat-head-meta`, `.chat-head-tags`
  y `.chat-head-actions` (`.pill-ia` + `.icon-btn`).
- Mensajes: `.chat-line` (`.in` / `.out`), `.chat-line-body`, `.msg-avatar` (solo entrantes),
  `.msg-meta`, `.chat-day-pill`.
- Compositor: `.composer`, `.composer-input`, `.circle-btn`, `.send-btn`, `.emoji-pop`.
- Columna de la lista: `.list-account`, `.list-online`, `.list-conv-head`, `.list-filters`,
  `.list-search`, `.list-extra`, `.conv-dot`, `.conv-avatar`, `.conv-name`, `.conv-time`, `.conv-preview`.

## 1. Cabecera del chat ✅

```
.chat-header
├─ avatar 42px con indicador de canal (borde del color de la superficie)
├─ .chat-head-id
│   ├─ .chat-head-name  (nombre + check verde + Mayorista)
│   ├─ .chat-head-meta  (teléfono · canal · última actividad hace X)
│   └─ .chat-head-tags  (Pendiente / Atendido por IA / etiquetas manuales)
└─ .chat-head-actions
    ├─ .pill-ia  ("● IA activa" verde | "○ IA en pausa" gris)
    ├─ .icon-btn (etiquetar)
    ├─ .icon-btn (llamar; deshabilitado si no hay teléfono)
    └─ .icon-btn (más)
```

Reglas de comportamiento que NO cambiaron:

- El toggle de IA escribe `needs_human` en `conversations` (misma lógica `botActive` de antes).
- El botón de etiqueta abre el popover de `labelMenuOpen` y guarda en `conversations.labels`.
- «Atendido», «Venta», «Asignar a», «Datos del cliente» y «Enviar plantilla» viven ahora en el menú
  «más» (`.chat-menu`), accesibles en un clic.

`meta-activity` se oculta por debajo de 560px para no romper la cabecera en móvil.

## 2. Mensajes ✅

- Avatar de 22 px con iniciales **solo en los entrantes** (`.msg-avatar`).
- Hora debajo del bloque (`.msg-meta`), alineada al lado de la burbuja; para los salientes va a la
  derecha. Los iconos de responder/editar/eliminar se mudaron ahí.
- Píldora de fecha centrada al inicio de cada día (`.chat-day-pill`, «Hoy · 16 de noviembre»,
  «Ayer · …»).
- Marca de IA en los mensajes del bot (`· IA`): el backend guarda las respuestas automáticas como
  `role: 'agent'` **sin** `sender_name`, así que la marca usa
  `role === 'assistant' || (role === 'agent' && !sender_name)`. La etiqueta de cabecera
  «Atendido por IA» usa el mismo criterio.

## 3. Composer ✅

- Adjuntar circular de 34 px con borde de 1 px.
- Input sin borde, tipografía 12,5 px (`textarea` con auto-alto).
- Emoji (con popover de 24 emojis) y micrófono como botones circulares.
- Enviar: círculo índigo `#4353FF` de 36 px, deshabilitado si no hay texto.
- El envío de plantilla de WhatsApp se movió al menú «más» de la cabecera.

## 4. Columna de la lista ✅

- Cabecera con avatar grande (52 px), nombre del asesor y «Mi cuenta».
- Bloque «En línea» con avatares del equipo y contador.
- «Conversaciones» con contador y filtros subrayados: Todos / Pendientes / IA / Míos
  (estado `statusFilter`, dentro de `displayedConversations`).
- Filas sin píldoras de color: solo un punto ámbar de 5 px cuando está pendiente.
- Los filtros de canal, el filtro por asesor y «Seleccionar chats» (exportar / re-marketing) quedaron
  detrás del botón de filtros de la tarjeta de cuenta, para no llenar la cabecera.
- La hora de la fila se acorta: hora si es de hoy, «Ayer» o fecha corta.

## Orden y verificación

1. Cabecera → build + captura.
2. Mensajes (avatar, hora, fecha) → build + captura.
3. Composer → build + captura.
4. Columna izquierda → build + captura.

Build y captura local:

```
cd chatbot-crm
npm run build
node ..\_audit\serve.mjs 4173      # sirve dist con fallback SPA
node .tmp\verify.mjs               # login + capturas + pruebas de IA/etiquetas/envío
```

`verify.mjs` crea una conversación `SIM_QA_*` asignada al asesor, prueba el toggle de IA
(`needs_human` en la base), añade y quita una etiqueta (`conversations.labels`) y envía un mensaje
(se guarda en `conversations.messages`). Al terminar la archiva: la política RLS del rol asesor no
permite `DELETE`, así que quedan filas `QA borrar (archivada)` ocultas en la bandeja.

Verificación ejecutada (1440×950 y 390×844, sin errores de consola):

- `needs_human`: `true` → toggle → `true` en la base → toggle → `false` (y la píldora cambia de texto).
- Etiqueta «PruebaQA»: aparece en la cabecera y en `labels`; al quitarla vuelve a `[]`.
- Envío: el botón se habilita con texto, el mensaje queda en `messages`, se pinta en el DOM y el
  composer se vacía.
- Búsqueda: «Andres» devuelve 18 conversaciones.
- Filtro «Pendientes»: 24 filas, cabecera con la etiqueta «Pendiente».
- Menú «más»: Marcar como pendiente, Registrar venta, Asignar a, Datos del cliente, Archivar,
  Eliminar (solo admin).
