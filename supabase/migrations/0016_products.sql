-- MiniFlow — Fase 3
-- products: the tenant's catalog of courses/content products. "preço" is
-- stored/displayed only — no checkout exists until Fase 7, same deferred-
-- enforcement pattern as mini_apps.required_plan. Access is admin-granted
-- per user via product_access (0017), not role-based — no self-serve flow.
--
-- "Comunidade" and "certificado" are Fase 4/5 features that don't exist
-- yet. No column for either here: a FK to a nonexistent table isn't valid
-- SQL, and a flag with no backing feature is dead UI. Each future phase
-- adds its own nullable FK via ALTER TABLE when its table exists — the
-- same mechanism mini_apps.content_html used in 0013.

create table public.products (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  category_id   uuid references public.product_categories(id) on delete set null,
  name          text not null,
  slug          text not null,
  description   text,
  image_url     text,
  -- Integer cents, not numeric/float — avoids locale/rounding ambiguity.
  price_cents   integer not null default 0 check (price_cents >= 0),
  status        text not null default 'draft'
                  check (status in ('draft', 'published', 'archived')),
  is_active     boolean not null default true,
  is_featured   boolean not null default false,
  sort_order    integer not null default 0,
  required_plan text not null default 'free',
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (tenant_id, slug)
);

create index products_tenant_idx on public.products (tenant_id);
create index products_tenant_status_active_idx on public.products (tenant_id, status, is_active);
create index products_category_idx on public.products (category_id);

create trigger set_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

alter table public.products enable row level security;
alter table public.products force row level security;

create policy "products_manage" on public.products
  for all to authenticated
  using (public.is_super_admin() or public.has_permission(tenant_id, 'products.manage'))
  with check (public.is_super_admin() or public.has_permission(tenant_id, 'products.manage'));
-- No member-facing select policy yet: can_view_product() (0017) depends on
-- product_access, which doesn't exist until the next migration.
