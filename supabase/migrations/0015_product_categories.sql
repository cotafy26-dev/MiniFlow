-- MiniFlow — Fase 3
-- product_categories: tenant-curated categories for the products catalog.
-- Deliberately a separate table from mini_app_categories (0011) — a tenant
-- may want a different taxonomy for courses than for mini-apps.

create table public.product_categories (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  name       text not null,
  slug       text not null,
  icon       text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create index product_categories_tenant_idx on public.product_categories (tenant_id);

create trigger set_product_categories_updated_at
  before update on public.product_categories
  for each row execute function public.set_updated_at();

alter table public.product_categories enable row level security;
alter table public.product_categories force row level security;

create policy "product_categories_select" on public.product_categories
  for select to authenticated
  using (public.is_super_admin() or tenant_id = public.current_tenant_id());

create policy "product_categories_manage" on public.product_categories
  for all to authenticated
  using (public.is_super_admin() or public.has_permission(tenant_id, 'products.manage'))
  with check (public.is_super_admin() or public.has_permission(tenant_id, 'products.manage'));
