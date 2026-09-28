-- MiniFlow — Fase 5
-- New permission for configuring levels/badges and manually issuing
-- certificates, mirroring 0028's shape.

insert into public.permissions (key, description) values
  ('gamification.manage', 'Configurar níveis, badges e emitir certificados manualmente');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'admin' and p.key = 'gamification.manage';
