-- MiniFlow — Fase 1
-- tenant_memberships: per-(tenant, user) role assignment.
-- current_tenant_id()/has_permission(): the functions every later RLS
-- policy in this project is built on.
-- Also wires up the on_auth_user_created trigger now that every table
-- handle_new_user() touches (roles, tenants, tenant_settings via the next
-- migration's dependency, tenant_memberships) exists or is about to.

create table public.tenant_memberships (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role_id         uuid not null references public.roles(id),
  status          text not null default 'active' check (status in ('active', 'invited', 'suspended')),
  is_tenant_owner boolean not null default false,
  invited_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create index tenant_memberships_user_idx on public.tenant_memberships (user_id);
create index tenant_memberships_tenant_idx on public.tenant_memberships (tenant_id);

create trigger set_tenant_memberships_updated_at
  before update on public.tenant_memberships
  for each row
  execute function public.set_updated_at();

alter table public.profiles
  add constraint profiles_default_tenant_fk
  foreign key (default_tenant_id) references public.tenants(id);

alter table public.tenant_memberships enable row level security;
alter table public.tenant_memberships force row level security;
-- Select/write policies for tenant_memberships live in 0009_rls_policies.sql
-- alongside tenants' and tenant_settings' policies (kept together for
-- readability — they all lean on has_permission(), defined below).

create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select default_tenant_id from public.profiles where id = auth.uid();
$$;

comment on function public.current_tenant_id() is
  'The signed-in user''s default/active tenant. Fase 1 users belong to exactly one tenant (set by handle_new_user()); multi-tenant switching is a later-phase UI concern, not a schema one — the column already supports it.';

create or replace function public.has_permission(p_tenant_id uuid, p_perm text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin() or exists (
    select 1
    from public.tenant_memberships tm
    join public.role_permissions rp on rp.role_id = tm.role_id
    join public.permissions p on p.id = rp.permission_id
    where tm.user_id = auth.uid()
      and tm.tenant_id = p_tenant_id
      and tm.status = 'active'
      and p.key = p_perm
  );
$$;

-- Convenience overload for the common "check against my current tenant" case.
create or replace function public.has_permission(p_perm text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_permission(public.current_tenant_id(), p_perm);
$$;

comment on function public.has_permission(uuid, text) is
  'True if the signed-in user is Super Admin, or holds a permission key (via their role) in the given tenant. SECURITY DEFINER so it can evaluate role_permissions/tenant_memberships regardless of the caller''s own RLS visibility into those tables.';

-- Protects the tenant owner: only Super Admin may demote or remove the
-- owner membership row. Prevents an admin from accidentally (or an
-- attacker deliberately) locking the real owner out of their own tenant.
create or replace function public.guard_tenant_owner()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (tg_op = 'DELETE' and old.is_tenant_owner and not public.is_super_admin()) then
    raise exception 'Não é possível remover o proprietário do tenant.';
  end if;
  if (tg_op = 'UPDATE' and old.is_tenant_owner and new.is_tenant_owner = false and not public.is_super_admin()) then
    raise exception 'Não é possível rebaixar o proprietário do tenant.';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger tenant_memberships_guard_owner
  before update or delete on public.tenant_memberships
  for each row
  execute function public.guard_tenant_owner();

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
