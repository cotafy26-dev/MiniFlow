-- MiniFlow — Fase 3
-- product_access: the admin-grant mechanism. Row existence = access, the
-- same modeling as tenant_memberships/mini_app_visible_roles. No self-
-- serve/webhook grant until Fase 7.

create table public.product_access (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  granted_by  uuid references auth.users(id),
  granted_at  timestamptz not null default now(),
  unique (product_id, user_id)
);

create index product_access_tenant_idx on public.product_access (tenant_id);
create index product_access_user_idx on public.product_access (user_id);
create index product_access_product_idx on public.product_access (product_id);

alter table public.product_access enable row level security;
alter table public.product_access force row level security;

create policy "product_access_select" on public.product_access
  for select to authenticated
  using (
    public.is_super_admin()
    or public.has_permission(tenant_id, 'products.manage')
    or user_id = auth.uid()
  );

create policy "product_access_manage" on public.product_access
  for all to authenticated
  using (public.is_super_admin() or public.has_permission(tenant_id, 'products.manage'))
  with check (public.is_super_admin() or public.has_permission(tenant_id, 'products.manage'));

-- Centralizes the member-facing product-visibility check the same way
-- can_view_mini_app() does — SECURITY DEFINER so it can evaluate
-- product_access regardless of the caller's own RLS visibility into it.
create or replace function public.can_view_product(p_product_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin() or exists (
    select 1
    from public.products p
    join public.product_access pa
      on pa.product_id = p.id and pa.user_id = auth.uid()
    where p.id = p_product_id
      and p.status = 'published'
      and p.is_active = true
  );
$$;

comment on function public.can_view_product(uuid) is
  'True if Super Admin, or the caller has an explicit product_access grant and the product is published+active. Mirrors can_view_mini_app(), but the grant is per-user, not per-role.';

create policy "products_select_visible" on public.products
  for select to authenticated
  using (public.can_view_product(id));
