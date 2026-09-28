-- MiniFlow — Fase 4
-- Communities ("grupos"): admin-created containers members join to post in.
-- Distinct from the Feed, which has no container — see 0023_posts.sql.

create table public.communities (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  name        text not null,
  slug        text not null,
  description text,
  image_url   text,
  -- 'open': any active tenant member self-joins. 'closed': admin adds
  -- members manually (still visible in the directory, just not self-joinable).
  visibility  text not null default 'open' check (visibility in ('open', 'closed')),
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (tenant_id, slug)
);

create index communities_tenant_idx on public.communities (tenant_id);

create trigger set_communities_updated_at
  before update on public.communities
  for each row
  execute function public.set_updated_at();

alter table public.communities enable row level security;
alter table public.communities force row level security;

create policy "communities_select" on public.communities
  for select to authenticated
  using (
    public.has_permission(tenant_id, 'community.manage')
    or public.is_active_tenant_member(tenant_id)
  );

create policy "communities_manage" on public.communities
  for all to authenticated
  using (public.is_super_admin() or public.has_permission(tenant_id, 'community.manage'))
  with check (public.is_super_admin() or public.has_permission(tenant_id, 'community.manage'));

-- Membership: who belongs to which community, with a cosmetic display
-- role/badge and a moderation status.
create table public.community_members (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  -- Community-facing display badge only — NOT wired into has_permission()
  -- or any RLS check. Real moderation power stays platform-level
  -- (community.moderate), independent of this column.
  role         text not null default 'member' check (role in ('member', 'moderator', 'vip')),
  status       text not null default 'active' check (status in ('active', 'banned')),
  joined_at    timestamptz not null default now(),
  unique (community_id, user_id)
);

create index community_members_tenant_idx on public.community_members (tenant_id);
create index community_members_community_idx on public.community_members (community_id);
create index community_members_user_idx on public.community_members (user_id);

alter table public.community_members enable row level security;
alter table public.community_members force row level security;

create or replace function public.is_community_member(p_community_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.community_members cm
    where cm.community_id = p_community_id and cm.user_id = auth.uid() and cm.status = 'active'
  );
$$;

comment on function public.is_community_member(uuid) is
  'True if the signed-in user has an active (non-banned) membership row in the given community. Building block for posts/comments/likes RLS.';

create policy "community_members_select" on public.community_members
  for select to authenticated
  using (
    public.is_super_admin()
    or public.has_permission(tenant_id, 'community.manage')
    or public.has_permission(tenant_id, 'community.moderate')
    or user_id = auth.uid()
    or public.is_community_member(community_id)
  );

create policy "community_members_manage" on public.community_members
  for all to authenticated
  using (
    public.is_super_admin()
    or public.has_permission(tenant_id, 'community.manage')
    or public.has_permission(tenant_id, 'community.moderate')
  )
  with check (
    public.is_super_admin()
    or public.has_permission(tenant_id, 'community.manage')
    or public.has_permission(tenant_id, 'community.moderate')
  );

-- Self-join: only into an open, active community, only as a plain member
-- (never lets a joiner grant themselves the moderator/vip badge).
create policy "community_members_self_join" on public.community_members
  for insert to authenticated
  with check (
    user_id = auth.uid() and role = 'member' and status = 'active'
    and exists (
      select 1 from public.communities c
      where c.id = community_id and c.tenant_id = community_members.tenant_id
        and c.is_active and c.visibility = 'open'
    )
  );

-- Self-leave: scoped to status='active' only, so a banned member can't
-- delete their own banned row and re-insert as active via the self-join
-- policy above.
create policy "community_members_self_leave" on public.community_members
  for delete to authenticated
  using (user_id = auth.uid() and status = 'active');
