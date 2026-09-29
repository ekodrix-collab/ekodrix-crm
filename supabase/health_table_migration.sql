-- Ekodrix Health Monitoring: app_health table
-- This table is used exclusively for application health checks.
-- It does not contain any business or customer data.

create table if not exists public.app_health (
  id integer primary key,
  created_at timestamptz not null default now()
);

insert into public.app_health (id)
values (1)
on conflict (id) do nothing;

alter table public.app_health enable row level security;

drop policy if exists "Allow health check read" on public.app_health;

create policy "Allow health check read"
on public.app_health
for select
to anon, authenticated
using (true);
