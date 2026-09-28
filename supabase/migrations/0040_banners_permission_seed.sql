-- MiniFlow — Fase 4 (Banners)
-- New permission for the banners feature, mirroring 0038's shape.

insert into public.permissions (key, description) values
  ('banners.manage', 'Cadastrar, editar, ativar/desativar e remover banners promocionais do tenant');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'admin' and p.key = 'banners.manage';
