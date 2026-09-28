-- MiniFlow — Fase 7
-- Which external-platform product id a local `products` row corresponds
-- to, per integration. Gated by products.manage (not integrations.manage)
-- since this is edited from the product screen by whoever already manages
-- products.

create table public.product_integration_links (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references public.tenants(id) on delete cascade,
  product_id          uuid not null references public.products(id) on delete cascade,
  integration_id      uuid not null references public.integrations(id) on delete cascade,
  external_product_id text not null,
  created_at          timestamptz not null default now(),
  -- Lets the webhook handler resolve (integration_id, external_product_id)
  -- to at most one local product, unambiguously.
  unique (integration_id, external_product_id)
);

create index product_integration_links_product_idx on public.product_integration_links (product_id);
create index product_integration_links_tenant_idx on public.product_integration_links (tenant_id);

alter table public.product_integration_links enable row level security;
alter table public.product_integration_links force row level security;

create policy "product_integration_links_manage" on public.product_integration_links
  for all to authenticated
  using (public.is_super_admin() or public.has_permission(tenant_id, 'products.manage'))
  with check (public.is_super_admin() or public.has_permission(tenant_id, 'products.manage'));
