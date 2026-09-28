-- MiniFlow — Fase 1
-- Super Admin (platform-level, not scoped to any tenant).

create table public.platform_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;
alter table public.platform_admins force row level security;

-- A user may check whether *they* are a platform admin (used by client-side
-- UI to conditionally show a "Painel da Plataforma" link). No one may read
-- the full roster through this policy; that requires a dedicated admin
-- panel query path built in a later phase.
create policy "platform_admins_self_select" on public.platform_admins
  for select
  to authenticated
  using (user_id = auth.uid());

-- No insert/update/delete policy for `authenticated` at all: platform admins
-- are only ever managed via scripts/create-super-admin.mjs (service role)
-- or, later, a dedicated Super Admin panel using the same service-role path.

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.platform_admins where user_id = auth.uid()
  );
$$;

comment on function public.is_super_admin() is
  'True when the currently authenticated user is a platform-level Super Admin. SECURITY DEFINER so it can read platform_admins regardless of the caller''s own RLS visibility into that table.';
