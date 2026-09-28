-- MiniFlow — Convite de membro
-- invitations: closes the gap where a new signup always creates its own
-- tenant (handle_new_user()) — there was previously no way to add a
-- second person to an existing tenant. v1 scope: only emails with no
-- existing account (multi-tenant-per-account is a separate, deferred
-- feature).

create table public.invitations (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  email      text not null,
  role_id    uuid not null references public.roles(id),
  token      text not null unique,
  status     text not null default 'pending'
               check (status in ('pending', 'accepted', 'revoked', 'expired')),
  invited_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

-- One pending invite per (tenant, email) — resending edits this row
-- instead of duplicating it (handled in the action).
create unique index invitations_pending_unique on public.invitations (tenant_id, email)
  where status = 'pending';

alter table public.invitations enable row level security;
alter table public.invitations force row level security;

create policy "invitations_manage" on public.invitations
  for all to authenticated
  using (public.is_super_admin() or public.has_permission(tenant_id, 'members.manage'))
  with check (public.is_super_admin() or public.has_permission(tenant_id, 'members.manage'));

-- The invitee has no session yet when opening /invite/[token] — same
-- pattern as verify_certificate (0036): SECURITY DEFINER + grant to
-- anon, returns only what the accept screen needs, never the raw table.
create or replace function public.get_invitation_by_token(p_token text)
returns table (tenant_name text, email text, role_name text, status text, expires_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select t.name, i.email, r.name, i.status, i.expires_at
  from public.invitations i
  join public.tenants t on t.id = i.tenant_id
  join public.roles r on r.id = i.role_id
  where i.token = p_token;
$$;

comment on function public.get_invitation_by_token(text) is
  'Public lookup backing /invite/[token] — the token itself is the credential (unguessable, single-use via status). Never exposes the raw invitations row.';

grant execute on function public.get_invitation_by_token(text) to anon, authenticated;

-- "Does this email already have an account" without granting any admin
-- direct SELECT on profiles (profiles_select_self_or_super_admin, 0005,
-- already blocks that) — returns only a boolean.
create or replace function public.email_has_account(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where email = p_email);
$$;

grant execute on function public.email_has_account(text) to authenticated;
