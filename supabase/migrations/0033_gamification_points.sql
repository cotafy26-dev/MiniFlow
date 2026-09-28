-- MiniFlow — Fase 5
-- Points ledger: one row per point-earning event. No INSERT policy for
-- `authenticated` at all — award_points() below is the only write path,
-- deciding the point value itself so the client never supplies it (same
-- discipline as log_activity() in 0008).

create table public.gamification_points (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  points      integer not null,
  reason      text not null check (reason in
                ('lesson_completed', 'post_created', 'comment_created', 'community_joined')),
  entity_type text,
  entity_id   uuid,
  created_at  timestamptz not null default now(),
  -- Prevents awarding twice for the same entity (e.g. the same lesson).
  unique (user_id, reason, entity_id)
);

create index gamification_points_tenant_user_idx on public.gamification_points (tenant_id, user_id);

alter table public.gamification_points enable row level security;
alter table public.gamification_points force row level security;

create policy "gamification_points_select" on public.gamification_points
  for select to authenticated
  using (
    public.is_super_admin()
    or public.has_permission(tenant_id, 'gamification.manage')
    or user_id = auth.uid()
  );

-- Point value per reason is decided here, server-side — the caller only
-- says which action happened, never how many points it's worth.
create or replace function public.award_points(
  p_reason      text,
  p_entity_type text,
  p_entity_id   uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_points    integer;
begin
  v_tenant_id := public.current_tenant_id();
  if v_tenant_id is null then return; end if;

  v_points := case p_reason
    when 'lesson_completed'   then 10
    when 'post_created'       then 5
    when 'comment_created'    then 2
    when 'community_joined'   then 15
    else null
  end;
  if v_points is null then
    raise exception 'Unknown gamification reason: %', p_reason;
  end if;

  insert into public.gamification_points (tenant_id, user_id, points, reason, entity_type, entity_id)
  values (v_tenant_id, auth.uid(), v_points, p_reason, p_entity_type, p_entity_id)
  on conflict (user_id, reason, entity_id) do nothing;

  perform public.check_and_award_badges(v_tenant_id, auth.uid());
end;
$$;

comment on function public.award_points(text, text, uuid) is
  'Only write path into gamification_points. The point value is decided here (server-side), never accepted from the caller. Invoked from the corresponding server actions (lesson completed, post created, comment created, joined a community). Forward-references check_and_award_badges(), defined in 0034 — safe because this function body isn''t executed until called, only parsed at creation time.';
