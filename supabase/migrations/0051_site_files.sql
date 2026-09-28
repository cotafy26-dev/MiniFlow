-- MiniFlow — Sites v2 (multi-arquivo)
-- Sites v1 only accepted a single pasted HTML blob. Real-world static
-- builds (React/Vite/etc.) are multi-file — index.html referencing
-- sibling assets (JS/CSS/images) — so v1 broke on anything but a truly
-- self-contained single-file page. First use of Supabase Storage in
-- this project: a private bucket that neither the admin upload path nor
-- the public-serving route ever touch directly from the browser — both
-- go through the server-only service-role client, so the bucket being
-- private is the only access control needed (no storage.objects policy).

insert into storage.buckets (id, name, public, file_size_limit)
values ('sites', 'sites', false, 10485760) -- 10 MB per file
on conflict (id) do nothing;

create table public.site_files (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  site_id      uuid not null references public.sites(id) on delete cascade,
  path         text not null,
  storage_path text not null,
  content_type text not null,
  size_bytes   integer not null,
  created_at   timestamptz not null default now(),
  unique (site_id, path)
);

create index site_files_site_idx on public.site_files (site_id);

alter table public.site_files enable row level security;
alter table public.site_files force row level security;

create policy "site_files_manage" on public.site_files
  for all to authenticated
  using (public.is_super_admin() or public.has_permission(tenant_id, 'apps.manage'))
  with check (public.is_super_admin() or public.has_permission(tenant_id, 'apps.manage'));

-- Public serving no longer depends on html_content — it only needs to
-- resolve subdomain -> site id; the actual file lookup/download happens
-- server-side via the admin client (RLS already bypassed there).
-- CREATE OR REPLACE can't change a function's RETURNS TABLE column set,
-- so the old (html_content, is_active) signature has to be dropped first.
drop function if exists public.get_site_by_subdomain(text);

create function public.get_site_by_subdomain(p_subdomain text)
returns table (id uuid, is_active boolean)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.is_active from public.sites s where s.subdomain = p_subdomain;
$$;

-- DROP + CREATE (unlike CREATE OR REPLACE) does not preserve grants —
-- re-grant to anon/authenticated, same as 0050 originally did.
grant execute on function public.get_site_by_subdomain(text) to anon, authenticated;

alter table public.sites drop column html_content;
