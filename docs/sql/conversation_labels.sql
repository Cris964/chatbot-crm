-- Etiquetas de conversaciones para el Inbox.
-- Ejecutar una vez en Supabase → SQL Editor → New query → Run.
--
-- Sin esta columna, el botón de etiquetas del Inbox muestra un aviso y no
-- guarda nada; el resto del CRM funciona igual.

alter table public.conversations
  add column if not exists labels text[] not null default '{}';

-- Búsqueda rápida por etiqueta (filtro de la barra lateral)
create index if not exists conversations_labels_gin
  on public.conversations using gin (labels);

comment on column public.conversations.labels is
  'Etiquetas manuales del asesor. Ej: {"pendiente","atendido por ia","mayorista"}';

-- (Opcional) ver las etiquetas en uso
-- select unnest(labels) as etiqueta, count(*)
-- from public.conversations
-- group by 1
-- order by 2 desc;
