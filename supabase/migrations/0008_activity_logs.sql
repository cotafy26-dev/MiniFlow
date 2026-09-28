-- MiniFlow — Fase 1
-- Audit log: login, permission changes, admin actions. tenant_id is
-- nullable to allow platform-level entries (e.g. a Super Admin action that
-- isn't scoped to any single tenant).

create table public.activity_logs (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid references public.tenants(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  -- Snapshot, not a join target: survives the actor's account being deleted.
  actor_email   text,
  action        text not null,
  entity_type   text,
  entity_id     text,
  metadata      jsonb not null default '{}'::jsonb,
  ip_address    inet,
  user_agent    text,
  created_at    timestamptz not null default now()
);

create index activity_logs_tenant_created_idx on public.activity_logs (tenant_id, created_at desc);
create index activity_logs_actor_idx on public.activity_logs (actor_user_id);

alter table public.activity_logs enable row level security;
alter table public.activity_logs force row level security;

-- No INSERT policy for `authenticated` at all: every row is written through
-- log_activity() below (SECURITY DEFINER), so we never have to reason about
-- "can user X log an action performed on user Y" as an RLS INSERT check.
create policy "activity_logs_select" on public.activity_logs
  for select to authenticated
  using (
    public.is_super_admin()
    or (tenant_id is not null and public.has_permission(tenant_id, 'activity_logs.view'))
  );

create or replace function public.log_activity(
  p_tenant_id   uuid,
  p_action      text,
  p_entity_type text default null,
  p_entity_id   text default null,
  p_metadata    jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id    uuid;
  v_email text;
begin
  -- This function is SECURITY DEFINER and callable directly by any
  -- authenticated client (Supabase grants EXECUTE on functions by
  -- default) — without this check, any signed-in user could inject
  -- fabricated entries into another tenant's audit log by passing its
  -- tenant_id. Require Super Admin or actual membership in that tenant.
  if p_tenant_id is not null
     and not public.is_super_admin()
     and not exists (
       select 1 from public.tenant_memberships tm
       where tm.tenant_id = p_tenant_id and tm.user_id = auth.uid() and tm.status = 'active'
     )
  then
    raise exception 'Not a member of the target tenant.';
  end if;

  select email into v_email from public.profiles where id = auth.uid();

  insert into public.activity_logs (tenant_id, actor_user_id, actor_email, action, entity_type, entity_id, metadata)
  values (p_tenant_id, auth.uid(), v_email, p_action, p_entity_type, p_entity_id, p_metadata)
  returning id into v_id;

  return v_id;
end;
$$;

comment on function public.log_activity(uuid, text, text, text, jsonb) is
  'Single write path into activity_logs. Call from server actions/route handlers after auth-sensitive operations (login, password reset, settings change, membership change, ...).';
