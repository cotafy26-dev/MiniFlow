-- MiniFlow — Fase 4
-- New permission keys for Feed + Comunidade, mirroring 0010/0014's shape.
-- community.moderate already exists (seeded by 0004, moderator-only) with
-- the comment "escopo ativado na Fase 4" — this migration activates it for
-- admin too, alongside the two brand-new keys.

insert into public.permissions (key, description) values
  ('feed.publish',     'Publicar, editar, fixar e remover posts no Feed do tenant'),
  ('community.manage', 'Criar e administrar comunidades/grupos e sua composição de membros');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'admin' and p.key in ('feed.publish', 'community.manage', 'community.moderate');
