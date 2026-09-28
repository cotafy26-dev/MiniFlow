-- MiniFlow — Fase 5
-- Tenant-configurable levels (name + point threshold) and badges (manual
-- or auto-awarded via a point threshold), mirroring the category-table
-- pattern already used by product_categories/mini_app_categories.

create table public.gamification_levels (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  name       text not null,
  min_points integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index gamification_levels_tenant_idx on public.gamification_levels (tenant_id);
create trigger set_gamification_levels_updated_at
  before update on public.gamification_levels
  for each row execute function public.set_updated_at();

alter table public.gamification_levels enable row level security;
alter table public.gamification_levels force row level security;

create policy "gamification_levels_select" on public.gamification_levels
  for select to authenticated using (public.is_active_tenant_member(tenant_id));

create policy "gamification_levels_manage" on public.gamification_levels
  for all to authenticated
  using (public.is_super_admin() or public.has_permission(tenant_id, 'gamification.manage'))
  with check (public.is_super_admin() or public.has_permission(tenant_id, 'gamification.manage'));

create table public.badges (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  name             text not null,
  description      text,
  icon             text,
  -- null = admin-only manual award. Set = auto-awarded once the user's
  -- total points reach this value (see check_and_award_badges below).
  points_threshold integer,
  is_active        boolean not null default true,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index badges_tenant_idx on public.badges (tenant_id);
create trigger set_badges_updated_at
  before update on public.badges
  for each row execute function public.set_updated_at();

alter table public.badges enable row level security;
alter table public.badges force row level security;

create policy "badges_select" on public.badges
  for select to authenticated using (public.is_active_tenant_member(tenant_id));

create policy "badges_manage" on public.badges
  for all to authenticated
  using (public.is_super_admin() or public.has_permission(tenant_id, 'gamification.manage'))
  with check (public.is_super_admin() or public.has_permission(tenant_id, 'gamification.manage'));

create table public.user_badges (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  badge_id   uuid not null references public.badges(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  unique (badge_id, user_id)
);

create index user_badges_tenant_user_idx on public.user_badges (tenant_id, user_id);

alter table public.user_badges enable row level security;
alter table public.user_badges force row level security;

create policy "user_badges_select" on public.user_badges
  for select to authenticated using (public.is_active_tenant_member(tenant_id));

-- Manual grant/revoke by an admin (badges with no points_threshold, or a
-- manual correction of any badge). Automatic awarding (inside
-- award_points -> check_and_award_badges) runs as the function owner and
-- bypasses RLS, so it doesn't depend on this policy.
create policy "user_badges_manage" on public.user_badges
  for all to authenticated
  using (public.is_super_admin() or public.has_permission(tenant_id, 'gamification.manage'))
  with check (public.is_super_admin() or public.has_permission(tenant_id, 'gamification.manage'));

create or replace function public.check_and_award_badges(p_tenant_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
begin
  select coalesce(sum(points), 0) into v_total
  from public.gamification_points
  where tenant_id = p_tenant_id and user_id = p_user_id;

  insert into public.user_badges (tenant_id, badge_id, user_id)
  select p_tenant_id, b.id, p_user_id
  from public.badges b
  where b.tenant_id = p_tenant_id
    and b.is_active
    and b.points_threshold is not null
    and b.points_threshold <= v_total
  on conflict (badge_id, user_id) do nothing;
end;
$$;

comment on function public.check_and_award_badges(uuid, uuid) is
  'Awards every active threshold-based badge the user newly qualifies for. Called from award_points() after each point award — never called directly by application code.';
