-- MiniFlow — Fase 2
-- New permission for the mini-apps catalog admin surface (/admin/apps).
-- Granted to admin only for now — moderator/member access to mini_apps is
-- read-only and governed entirely by mini_apps' own RLS policies (role
-- visibility + published + active), not by this permission.

insert into public.permissions (key, description) values
  ('apps.manage', 'Cadastrar, editar e organizar o catálogo de mini-apps do tenant');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'admin' and p.key = 'apps.manage';
