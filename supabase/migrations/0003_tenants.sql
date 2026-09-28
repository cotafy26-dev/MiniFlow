-- MiniFlow — Fase 1
-- Tenants: one per customer/business. Every tenant-scoped table below
-- carries a tenant_id FK to this table.

create table public.tenants (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  status     text not null default 'active' check (status in ('active', 'suspended')),
  -- Placeholder FK target for a future `plans` table (billing phase, Fase 7).
  -- Kept as a plain text key now so Fase 1 never has to model billing.
  plan_key   text not null default 'free',
  owner_id   uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_tenants_updated_at
  before update on public.tenants
  for each row
  execute function public.set_updated_at();

alter table public.tenants enable row level security;
alter table public.tenants force row level security;
-- Policies for this table are defined in 0009_rls_policies.sql, once
-- current_tenant_id()/has_permission() exist (they depend on
-- tenant_memberships, created in 0006).
