-- MiniFlow — Fase 1
-- profiles: one row per auth.users row (app-facing user data).
-- handle_new_user(): the atomic signup -> tenant -> membership trigger.

create table public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  email              text not null,
  full_name          text not null,
  avatar_url         text,
  locale             text not null default 'pt' check (locale in ('pt', 'es', 'en')),
  -- No FK yet: public.tenants exists, but the FK is added in
  -- 0006_tenant_memberships.sql once we're sure both tables are final for
  -- this migration pass. Nullable because it's only set once
  -- handle_new_user() finishes creating the tenant below.
  default_tenant_id uuid,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

create policy "profiles_select_self_or_super_admin" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_super_admin());

create policy "profiles_update_self" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
-- No insert/delete policy for `authenticated`: rows are only ever created
-- by handle_new_user() (SECURITY DEFINER, below) and only ever deleted via
-- the auth.users -> profiles cascade.

-- Fires once per new auth.users row — both password signup and OAuth
-- signup land here. Creates, atomically: profile, a brand-new tenant
-- (the signer becomes its admin/owner), the owner's membership, and a
-- default tenant_settings row. There is no separate "onboarding" step that
-- can fail halfway through.
--
-- Tenant name comes from signup metadata when the register form collected
-- it (email/password path sends `tenant_name`); OAuth signups have no such
-- metadata, so we fall back to "{full_name}'s Workspace" — renaming the
-- tenant later is a Settings-page feature, not needed to unblock Fase 1.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name   text;
  v_tenant_name text;
  v_slug        text;
  v_tenant_id   uuid;
  v_admin_role  uuid;
begin
  v_full_name := coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1));
  v_tenant_name := coalesce(new.raw_user_meta_data ->> 'tenant_name', v_full_name || '''s Workspace');
  v_slug := lower(regexp_replace(v_tenant_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(new.id::text, 1, 8);

  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, v_full_name);

  insert into public.tenants (name, slug, owner_id)
  values (v_tenant_name, v_slug, new.id)
  returning id into v_tenant_id;

  insert into public.tenant_settings (tenant_id)
  values (v_tenant_id);

  select id into v_admin_role from public.roles where key = 'admin';

  insert into public.tenant_memberships (tenant_id, user_id, role_id, status, is_tenant_owner)
  values (v_tenant_id, new.id, v_admin_role, 'active', true);

  update public.profiles set default_tenant_id = v_tenant_id where id = new.id;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'AFTER INSERT ON auth.users: provisions profile + tenant + tenant_settings + owner membership atomically. References tenant_settings/tenant_memberships which are created in later migrations, so this function body is only valid once 0006 and 0007 have also run — Postgres allows this because the function is not invoked (the trigger below does not exist yet either) until 0006 creates the AFTER INSERT trigger.';
