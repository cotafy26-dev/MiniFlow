-- MiniFlow — Fase 4 (Suporte)
-- New permission for the ticket queue, mirroring 0032's shape.

insert into public.permissions (key, description) values
  ('support.manage', 'Ver e responder chamados de suporte de qualquer membro do tenant');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'admin' and p.key = 'support.manage';
