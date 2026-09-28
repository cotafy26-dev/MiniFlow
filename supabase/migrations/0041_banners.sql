-- MiniFlow — Fase 4 (Banners)
-- banners: promotional/informational images with an optional link, shown
-- on the member's Dashboard. Simpler than mini_apps (0012) — no per-role
-- targeting and no publish workflow, just is_active + an optional
-- starts_at/ends_at display window — so member visibility reuses
-- is_active_tenant_member() (Fase 4) instead of a bespoke can_view_*().

create table public.banners (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  title      text not null,
  image_url  text not null,
  link_url   text,
  is_active  boolean not null default true,
  starts_at  timestamptz,
  ends_at    timestamptz,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index banners_tenant_idx on public.banners (tenant_id);
create index banners_tenant_active_idx on public.banners (tenant_id, is_active, sort_order);

create trigger set_banners_updated_at
  before update on public.banners
  for each row
  execute function public.set_updated_at();

alter table public.banners enable row level security;
alter table public.banners force row level security;

-- banners.manage holders (or Super Admin) see/edit everything, including
-- inactive/scheduled banners — the admin list needs those too.
create policy "banners_manage" on public.banners
  for all to authenticated
  using (public.is_super_admin() or public.has_permission(tenant_id, 'banners.manage'))
  with check (public.is_super_admin() or public.has_permission(tenant_id, 'banners.manage'));

-- Ordinary members only see active banners currently inside their display window.
create policy "banners_select_visible" on public.banners
  for select to authenticated
  using (
    is_active
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
    and public.is_active_tenant_member(tenant_id)
  );
