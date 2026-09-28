-- MiniFlow — Fase 7
-- New permission for connecting payment/webhook integrations, mirroring
-- 0021's shape.

insert into public.permissions (key, description) values
  ('integrations.manage', 'Conectar integrações de pagamento e gerenciar webhooks');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'admin' and p.key = 'integrations.manage';
