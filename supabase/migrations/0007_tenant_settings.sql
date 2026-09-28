-- MiniFlow — Fase 1
-- Per-tenant configuration: locale/timezone now, branding + feature flags
-- as open-ended jsonb bags so later phases (Personalização, planos) don't
-- need new columns for every setting they introduce.

create table public.tenant_settings (
  tenant_id  uuid primary key references public.tenants(id) on delete cascade,
  locale     text not null default 'pt' check (locale in ('pt', 'es', 'en')),
  timezone   text not null default 'America/Sao_Paulo',
  -- {logo_url, favicon_url, primary_color, ...} — Personalização UI, Fase 2+.
  branding   jsonb not null default '{}'::jsonb,
  -- Feature-flag bag for gating not-yet-built modules per tenant/plan.
  features   jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create trigger set_tenant_settings_updated_at
  before update on public.tenant_settings
  for each row
  execute function public.set_updated_at();

alter table public.tenant_settings enable row level security;
alter table public.tenant_settings force row level security;
-- Policies defined in 0009_rls_policies.sql.
