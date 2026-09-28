-- MiniFlow — Fundir Sites em Mini Apps
-- Um "site hospedado" (upload multi-arquivo por subdomínio) passa a ser um
-- tipo de mini_app ('hosted_site') em vez de um recurso à parte — assim
-- ganha catálogo em /apps, plano necessário e visibilidade por papel como
-- qualquer outro mini-app, mas continua respondendo no próprio subdomínio,
-- sem sandbox, exatamente como em sites/site_files (0050/0051).

alter table public.mini_apps
  add column subdomain text unique;

alter table public.mini_apps
  add constraint mini_apps_subdomain_format
  check (subdomain is null or subdomain ~ '^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$');

alter table public.mini_apps drop constraint mini_apps_type_check;
alter table public.mini_apps
  add constraint mini_apps_type_check
  check (type in (
    'internal_app', 'internal_page', 'external_app',
    'iframe', 'pwa', 'ai_tool', 'hosted_site'
  ));

alter table public.mini_apps
  add constraint mini_apps_subdomain_required_when_hosted_site
  check (type <> 'hosted_site' or subdomain is not null);

create table public.mini_app_files (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  mini_app_id  uuid not null references public.mini_apps(id) on delete cascade,
  path         text not null,
  storage_path text not null,
  content_type text not null,
  size_bytes   integer not null,
  created_at   timestamptz not null default now(),
  unique (mini_app_id, path)
);

create index mini_app_files_mini_app_idx on public.mini_app_files (mini_app_id);

alter table public.mini_app_files enable row level security;
alter table public.mini_app_files force row level security;

create policy "mini_app_files_manage" on public.mini_app_files
  for all to authenticated
  using (public.is_super_admin() or public.has_permission(tenant_id, 'apps.manage'))
  with check (public.is_super_admin() or public.has_permission(tenant_id, 'apps.manage'));

-- Bucket antigo ("sites") está vazio hoje (0 linhas em site_files, o único
-- site real nunca teve arquivo publicado) — removido separadamente via
-- Storage API (o Supabase bloqueia DELETE direto em storage.buckets por
-- SQL). Buckets não têm rename, por isso é criado um novo em vez de
-- reaproveitar o nome antigo.
insert into storage.buckets (id, name, public, file_size_limit)
values ('mini-app-files', 'mini-app-files', false, 10485760)
on conflict (id) do nothing;

-- Migra a única linha real de sites para um mini_app 'hosted_site'. Fica em
-- rascunho (o admin decide quando publicar/definir papéis visíveis); quem já
-- visita o subdomínio não é afetado, já que isso só depende de is_active,
-- preservado abaixo. slug 'agenda-site' evita colidir com o mini_app de
-- teste que já existe com slug 'agenda'.
insert into public.mini_apps (
  tenant_id, name, slug, type, status, is_active, subdomain,
  required_plan, created_by, created_at
)
select tenant_id, name, 'agenda-site', 'hosted_site', 'draft', is_active,
       subdomain, 'free', created_by, created_at
from public.sites;

create function public.get_hosted_site_by_subdomain(p_subdomain text)
returns table (id uuid, is_active boolean)
language sql
stable
security definer
set search_path = public
as $$
  select ma.id, ma.is_active from public.mini_apps ma
  where ma.subdomain = p_subdomain and ma.type = 'hosted_site';
$$;

grant execute on function public.get_hosted_site_by_subdomain(text) to anon, authenticated;

drop function public.get_site_by_subdomain(text);

drop table public.site_files;
drop table public.sites;
