-- MiniFlow — Sites
-- Public, unauthenticated subdomain hosting for an admin-uploaded
-- index.html — distinct from mini_apps.type='internal_page' (gated by
-- role visibility, rendered inside a sandboxed iframe within the app
-- shell). Sites are meant to work like a real website (JS enabled, no
-- sandbox), so this is a separate resource rather than overloading
-- internal_page's existing, different visibility model.

create table public.sites (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  name         text not null,
  subdomain    text not null unique,
  html_content text,
  is_active    boolean not null default true,
  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint sites_subdomain_format check (subdomain ~ '^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$')
);

create index sites_tenant_idx on public.sites (tenant_id);

create trigger set_sites_updated_at
  before update on public.sites
  for each row
  execute function public.set_updated_at();

alter table public.sites enable row level security;
alter table public.sites force row level security;

-- Same shape as mini_apps_manage (0012): only this tenant's apps.manage
-- holders (or Super Admin) can see/edit.
create policy "sites_manage" on public.sites
  for all to authenticated
  using (public.is_super_admin() or public.has_permission(tenant_id, 'apps.manage'))
  with check (public.is_super_admin() or public.has_permission(tenant_id, 'apps.manage'));

-- A subdomain visitor has no session — same pattern as
-- verify_certificate/get_invitation_by_token: SECURITY DEFINER + grant
-- to anon, returns only what's needed to serve an active site's HTML,
-- never the raw table.
create or replace function public.get_site_by_subdomain(p_subdomain text)
returns table (html_content text, is_active boolean)
language sql
stable
security definer
set search_path = public
as $$
  select s.html_content, s.is_active from public.sites s where s.subdomain = p_subdomain;
$$;

grant execute on function public.get_site_by_subdomain(text) to anon, authenticated;
