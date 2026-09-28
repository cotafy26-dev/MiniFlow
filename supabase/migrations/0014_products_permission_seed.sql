-- MiniFlow — Fase 3
-- New permission for the products/content admin surface (/admin/products).
-- One permission covers product_categories, products, modules, lessons and
-- product_access grants — mirrors how apps.manage (0010) covered
-- mini_app_categories, mini_apps and mini_app_visible_roles as one unit.

insert into public.permissions (key, description) values
  ('products.manage', 'Cadastrar, editar e organizar produtos, módulos e aulas, e conceder acesso a membros');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'admin' and p.key = 'products.manage';
