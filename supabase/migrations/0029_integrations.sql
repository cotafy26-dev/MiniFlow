-- MiniFlow — Fase 7
-- One row per (tenant, provider) connection. `provider` is a closed list
-- covering the whole catalog (even providers without a working adapter
-- yet) so cataloging a new provider is an app-layer decision, not a
-- migration — the admin catalog UI decides which ones to show as active
-- vs "coming soon".

create table public.integrations (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  provider    text not null check (provider in
                ('hotmart', 'kiwify', 'cartpanda', 'eduzz', 'greenn', 'celetus')),
  -- Shape varies per provider (Hotmart: {token}) — same flexible-jsonb
  -- pattern already used by activity_logs.metadata / lessons.quiz_data.
  credentials jsonb not null default '{}'::jsonb,
  is_active   boolean not null default true,
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (tenant_id, provider)
);

create index integrations_tenant_idx on public.integrations (tenant_id);

create trigger set_integrations_updated_at
  before update on public.integrations
  for each row execute function public.set_updated_at();

alter table public.integrations enable row level security;
alter table public.integrations force row level security;

-- No public/self select policy: only integrations.manage holders ever see
-- a tenant's stored credentials, even other tenant members.
create policy "integrations_manage" on public.integrations
  for all to authenticated
  using (public.is_super_admin() or public.has_permission(tenant_id, 'integrations.manage'))
  with check (public.is_super_admin() or public.has_permission(tenant_id, 'integrations.manage'));
