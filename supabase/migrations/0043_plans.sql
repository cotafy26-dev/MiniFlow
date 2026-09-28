-- MiniFlow — Fase 7 (Planos/Limites)
-- plans: the platform's own subscription tiers. tenants.plan_key has
-- existed since Fase 1 (0003_tenants.sql) as free text with no FK —
-- this is the first migration that gives it something real to point at.
-- max_members/max_mini_apps/max_products null = unlimited.

create table public.plans (
  key           text primary key,
  name          text not null,
  sort_order    integer not null default 0,
  max_members   integer,
  max_mini_apps integer,
  max_products  integer,
  price_cents   integer,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger set_plans_updated_at
  before update on public.plans
  for each row
  execute function public.set_updated_at();

alter table public.plans enable row level security;
alter table public.plans force row level security;

-- Not a secret — any authenticated user can see the catalog (needed to
-- show "upgrade to X" on the tenant's own usage page).
create policy "plans_select" on public.plans
  for select to authenticated using (true);

-- Only Super Admin edits the catalog — this is a platform capability,
-- not a tenant permission, so it goes through is_super_admin() directly
-- rather than has_permission()/role_permissions.
create policy "plans_manage" on public.plans
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

insert into public.plans (key, name, sort_order, max_members, max_mini_apps, max_products, price_cents) values
  ('free', 'Gratuito', 0, 5, 3, 1, 0),
  ('pro',  'Pro',      1, null, null, null, 9700);

alter table public.tenants
  add constraint tenants_plan_key_fkey foreign key (plan_key) references public.plans(key);
