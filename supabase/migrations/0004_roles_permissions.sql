-- MiniFlow — Fase 1
-- Roles and permissions as data (not enums/check constraints), so a new
-- role or permission is an INSERT, never a schema migration.

create table public.roles (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,
  name        text not null,
  description text,
  -- Seeded roles (admin/moderator/member) are protected from deletion in
  -- application code; tenants cannot rename/delete them from a future UI.
  is_system   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.permissions (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,
  description text,
  created_at  timestamptz not null default now()
);

create table public.role_permissions (
  role_id       uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

alter table public.roles enable row level security;
alter table public.roles force row level security;
alter table public.permissions enable row level security;
alter table public.permissions force row level security;
alter table public.role_permissions enable row level security;
alter table public.role_permissions force row level security;

-- Catalog tables: any authenticated user may read them (the UI needs role/
-- permission labels to render), only Super Admin may write.
create policy "roles_read" on public.roles
  for select to authenticated using (true);
create policy "permissions_read" on public.permissions
  for select to authenticated using (true);
create policy "role_permissions_read" on public.role_permissions
  for select to authenticated using (true);

create policy "roles_write_super_admin" on public.roles
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());
create policy "permissions_write_super_admin" on public.permissions
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());
create policy "role_permissions_write_super_admin" on public.role_permissions
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- Seed data. Mirrored in supabase/seed.sql for local resets; kept here too
-- so `supabase db push` on a brand-new environment is self-sufficient.
insert into public.roles (key, name, description) values
  ('admin',     'Administrador', 'Controla o próprio tenant: usuários, configurações, conteúdo e mini-apps.'),
  ('moderator', 'Moderador',     'Modera a comunidade do tenant (escopo ativado na Fase 4).'),
  ('member',    'Aluno/Membro',  'Usuário final: acessa mini-apps, produtos e conteúdos liberados.');

insert into public.permissions (key, description) values
  ('tenant.settings.manage', 'Editar configurações do tenant'),
  ('members.view',           'Ver membros do tenant'),
  ('members.manage',         'Convidar, alterar papel e remover membros'),
  ('activity_logs.view',     'Ver o log de auditoria do tenant'),
  ('community.moderate',     'Moderar posts e comentários (escopo ativado na Fase 4)');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where (r.key = 'admin' and p.key in (
        'tenant.settings.manage', 'members.view', 'members.manage', 'activity_logs.view'
      ))
   or (r.key = 'moderator' and p.key in (
        'members.view', 'community.moderate'
      ));
