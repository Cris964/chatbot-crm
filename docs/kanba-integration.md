# Integración CRM ⇄ Kanba (soporte técnico)

App de gestión: **https://app.nexusgrouptec.com** (Laravel, API v1 con Bearer token).

## Identificadores

| Dato | Valor |
|---|---|
| Organización | `01m7pczgsbn26d1hkdry4w1jqj` · Nexus Group Technology |
| Proyecto «Soporte técnico» | `01m8f52yyhdrpqdp32gmyfak5p` |
| Columnas | 24 To Do · 25 In Progress · 26 Review · 27 Done |

Token de API: creado como «CRM Soporte» con `projects:read/write`, `tasks:read/write`, `webhooks:manage`.
Los comentarios usan `tasks:read` y `tasks:write`, así que **no** hacen falta habilidades extra.

## Endpoints usados

```
POST {API}/projects/{project}/tasks      crear caso        (tasks:write)
GET  {API}/tasks/{task}                  estado del caso   (tasks:read)
GET  {API}/tasks/{task}/comments         respuestas        (tasks:read)
POST {API}/tasks/{task}/comments         responder         (tasks:write)
PATCH {API}/tasks/{task}                 {completed:true}  cerrar
POST {API}/webhooks                      registrar webhook (webhooks:manage)
```

## Mapeo del caso

| CRM | Kanba |
|---|---|
| Nombre (quien abre) | primera línea de la descripción |
| Título | `title` con prefijo de prioridad: `[ALTA] No imprime` |
| Prioridad | prefijo en el título (Kanba no tiene campo prioridad) |
| Descripción | `description` + datos de contacto |
| Estado | `completed` de la tarea → `cerrado` en el CRM |
| Respuesta de cierre | último comentario de la tarea |

## Eventos de webhook disponibles

`task.created`, `task.assigned`, `task.due_changed`, `task.moved`, `task.completed`, `task.reopened`.
Los **comentarios no emiten webhook**: el CRM los consulta al abrir «Mis casos».

## Pendiente

1. Crear tablas en Supabase (`docs/sql/support_tickets.sql`).
2. UI del CRM: botón «Soporte técnico», formulario y vista «Mis casos».
3. Endpoint `POST /api/kanba-webhook` con secreto compartido.
4. Campana de notificaciones.
5. Registrar el webhook apuntando a `https://crm.nexusgrouptec.com/api/kanba-webhook`.
