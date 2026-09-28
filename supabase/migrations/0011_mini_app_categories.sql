-- MiniFlow — Fase 2
-- mini_app_categories: tenant-curated categories for organizing the
-- mini-apps catalog (spec's own examples: "IA", "Marketing",
-- "Produtividade" — each tenant defines its own, there is no fixed global
-- list). Referenced by mini_apps.category_id in the next migration.

create table public.mini_app_categories (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  name       text not null,
  slug       text not null,
  -- Emoji/short text, same convention as mini_apps.icon — no Storage
  -- upload flow exists yet, see mini_apps.icon comment in 0012.
  icon       text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create index mini_app_categories_tenant_idx on public.mini_app_categories (tenant_id);

create trigger set_mini_app_categories_updated_at
  before update on public.mini_app_categories
  for each row
  execute function public.set_updated_at();

alter table public.mini_app_categories enable row level security;
alter table public.mini_app_categories force row level security;

-- Any active member of the tenant may read categories (needed to render
-- catalog filters); only apps.manage holders (or Super Admin) may write.
create policy "mini_app_categories_select" on public.mini_app_categories
  for select to authenticated
  using (
    public.is_super_admin()
    or tenant_id = public.current_tenant_id()
  );

create policy "mini_app_categories_manage" on public.mini_app_categories
  for all to authenticated
  using (
    public.is_super_admin()
    or public.has_permission(tenant_id, 'apps.manage')
  )
  with check (
    public.is_super_admin()
    or public.has_permission(tenant_id, 'apps.manage')
  );
