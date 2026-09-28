-- MiniFlow — Fase 4
-- Closes a gap Fase 4 makes load-bearing: profiles' only SELECT policy
-- (0005) is `id = auth.uid() or is_super_admin()`, so no member can see
-- another member's name/avatar today. Every post/comment/like needs
-- exactly that (author display).

create or replace function public.is_active_tenant_member(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin() or exists (
    select 1 from public.tenant_memberships tm
    where tm.tenant_id = p_tenant_id and tm.user_id = auth.uid() and tm.status = 'active'
  );
$$;

comment on function public.is_active_tenant_member(uuid) is
  'True if the signed-in user is Super Admin or an active member of the given tenant. Building block for Fase 4 RLS (feed/community visibility) — narrower than has_permission(), which additionally requires a specific permission key.';

-- Batch-safe alternative to `.from("profiles").select().in("id", ids)`,
-- which RLS silently empties for anyone but self/Super Admin. Scoped to
-- "shares an active tenant with me" so a member never sees another
-- tenant's names.
create or replace function public.get_tenant_profiles(p_user_ids uuid[])
returns table (id uuid, full_name text, avatar_url text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.full_name, p.avatar_url
  from public.profiles p
  where p.id = any(p_user_ids)
    and (
      public.is_super_admin()
      or exists (
        select 1 from public.tenant_memberships tm1
        join public.tenant_memberships tm2 on tm2.tenant_id = tm1.tenant_id
        where tm1.user_id = auth.uid() and tm1.status = 'active'
          and tm2.user_id = p.id and tm2.status = 'active'
      )
    );
$$;

comment on function public.get_tenant_profiles(uuid[]) is
  'Batched profile lookup for rendering author names/avatars on posts/comments — bypasses profiles'' restrictive SELECT policy via SECURITY DEFINER, but only for ids that share an active tenant membership with the caller.';
