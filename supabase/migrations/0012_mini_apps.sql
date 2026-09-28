-- MiniFlow — Fase 2
-- mini_apps: the tenant's catalog of registered mini-apps, plus
-- mini_app_visible_roles (a role_permissions-style join table) modeling
-- "público-alvo" — which of the tenant's roles may see a given app.
--
-- Two independent gates control visibility, both enforced in RLS (not just
-- hidden in the UI):
--   - status/is_active: the admin's own publish workflow (draft/published/
--     archived) plus a separate on/off switch for temporarily hiding a
--     published app without losing its workflow state.
--   - mini_app_visible_roles: which roles can see it once published+active.
-- required_plan is stored but NOT enforced here — plan/billing hierarchy
-- doesn't exist until Fase 7 (Planos/Assinaturas); the column just avoids a
-- later migration to add it.

create table public.mini_apps (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  category_id   uuid references public.mini_app_categories(id) on delete set null,
  name          text not null,
  slug          text not null,
  description   text,
  -- Emoji/short text (spec mockups use "🧠" etc.) — no Storage upload flow
  -- yet; deliberately deferred to the first real file-upload feature
  -- (content/lessons, Fase 3+) so it gets built once and reused.
  icon          text,
  -- Larger cover image: a plain externally-hosted URL, same reasoning.
  image_url     text,
  -- Destination for external_app/iframe; null for the other four types
  -- until a real internal tool exists under src/apps/<slug>.
  url           text,
  type          text not null default 'external_app'
                  check (type in (
                    'internal_app', 'internal_page', 'external_app',
                    'iframe', 'pwa', 'ai_tool'
                  )),
  -- Publish workflow, independent of is_active below.
  status        text not null default 'draft'
                  check (status in ('draft', 'published', 'archived')),
  is_active     boolean not null default true,
  is_featured   boolean not null default false,
  sort_order    integer not null default 0,
  -- Placeholder plan key, same pattern as tenants.plan_key — no `plans`
  -- table or enforcement until Fase 7.
  required_plan text not null default 'free',
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (tenant_id, slug),
  -- A published external_app/iframe with no destination would be a dead
  -- link the moment it appears in the catalog — drafts of any type may
  -- still be saved without a URL while the admin fills in the form.
  constraint mini_apps_url_required_when_published_external
    check (
      type not in ('external_app', 'iframe')
      or status <> 'published'
      or url is not null
    )
);

create index mini_apps_tenant_idx on public.mini_apps (tenant_id);
create index mini_apps_tenant_status_active_idx on public.mini_apps (tenant_id, status, is_active);
create index mini_apps_category_idx on public.mini_apps (category_id);

create trigger set_mini_apps_updated_at
  before update on public.mini_apps
  for each row
  execute function public.set_updated_at();

alter table public.mini_apps enable row level security;
alter table public.mini_apps force row level security;

-- role_permissions-style join table: which roles (tenant-wide, since roles
-- are global rows, not per-tenant) can see a given mini-app once it's
-- published+active. A join table (not a `visible_to_roles text[]` column)
-- mirrors role_permissions exactly and gets a real FK to roles(id) — an
-- array of role keys would silently go stale if a role's key ever changed,
-- a join table cannot.
create table public.mini_app_visible_roles (
  mini_app_id uuid not null references public.mini_apps(id) on delete cascade,
  role_id     uuid not null references public.roles(id) on delete cascade,
  primary key (mini_app_id, role_id)
);

alter table public.mini_app_visible_roles enable row level security;
alter table public.mini_app_visible_roles force row level security;

-- Centralizes the member-facing visibility check the same way
-- has_permission() centralizes permission checks — SECURITY DEFINER so it
-- can evaluate tenant_memberships/mini_app_visible_roles regardless of the
-- caller's own RLS visibility into those tables.
create or replace function public.can_view_mini_app(p_mini_app_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin() or exists (
    select 1
    from public.mini_apps ma
    join public.tenant_memberships tm
      on tm.tenant_id = ma.tenant_id
     and tm.user_id = auth.uid()
     and tm.status = 'active'
    join public.mini_app_visible_roles mavr
      on mavr.mini_app_id = ma.id
     and mavr.role_id = tm.role_id
    where ma.id = p_mini_app_id
      and ma.status = 'published'
      and ma.is_active = true
  );
$$;

comment on function public.can_view_mini_app(uuid) is
  'True if the signed-in user is Super Admin, or is an active member of the mini-app''s tenant, in a role listed in mini_app_visible_roles, and the app is published+active. The read path members/moderators use to see mini_apps; admins with apps.manage see everything through mini_apps_manage below instead.';

-- apps.manage holders (or Super Admin) get full access to every row in
-- their tenant, including drafts/archived/inactive apps (the admin list
-- needs to show those too).
create policy "mini_apps_manage" on public.mini_apps
  for all to authenticated
  using (
    public.is_super_admin()
    or public.has_permission(tenant_id, 'apps.manage')
  )
  with check (
    public.is_super_admin()
    or public.has_permission(tenant_id, 'apps.manage')
  );

-- Everyone else only sees what can_view_mini_app() allows.
create policy "mini_apps_select_visible" on public.mini_apps
  for select to authenticated
  using (public.can_view_mini_app(id));

-- Only apps.manage holders (or Super Admin) ever touch this table directly
-- — members reach it exclusively through can_view_mini_app().
create policy "mini_app_visible_roles_manage" on public.mini_app_visible_roles
  for all to authenticated
  using (
    public.is_super_admin()
    or exists (
      select 1 from public.mini_apps ma
      where ma.id = mini_app_visible_roles.mini_app_id
        and public.has_permission(ma.tenant_id, 'apps.manage')
    )
  )
  with check (
    public.is_super_admin()
    or exists (
      select 1 from public.mini_apps ma
      where ma.id = mini_app_visible_roles.mini_app_id
        and public.has_permission(ma.tenant_id, 'apps.manage')
    )
  );
