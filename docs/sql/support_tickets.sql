-- Casos de soporte y notificaciones (integración con Kanba).
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid, user_id uuid, user_name text, user_email text,
  title text not null, description text,
  priority text not null default 'media',
  status text not null default 'abierto',
  kanba_task_uuid text, kanba_url text, resolution text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists support_tickets_client_idx on public.support_tickets (client_id, created_at desc);

create table if not exists public.support_ticket_replies (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references public.support_tickets(id) on delete cascade,
  author text not null, body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  client_id uuid, user_id uuid, kind text not null,
  title text not null, body text, link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
