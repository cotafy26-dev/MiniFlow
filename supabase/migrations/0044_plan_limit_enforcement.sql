-- MiniFlow — Fase 7 (Planos/Limites)
-- Usage-limit enforcement for the two resources that already have a real
-- creation flow (mini_apps, products). Same trigger-based guard style as
-- posts_guard_pin/guard_tenant_owner (0001/0023) — the raise exception
-- message reaches the client as error.message, so createMiniAppAction/
-- createProductAction need no changes: they already do
-- `if (error) return { error: error.message }`.
--
-- max_members is intentionally NOT enforced here — there is currently no
-- way to add a new member to an existing tenant (every signup creates
-- its own tenant via handle_new_user()), so there is no insert to guard
-- yet. plans.max_members stays schema-only until an invite flow exists.

create or replace function public.enforce_mini_app_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer;
  v_count integer;
begin
  select p.max_mini_apps into v_limit
  from public.tenants t join public.plans p on p.key = t.plan_key
  where t.id = new.tenant_id;

  if v_limit is not null then
    select count(*) into v_count from public.mini_apps where tenant_id = new.tenant_id;
    if v_count >= v_limit then
      raise exception 'Limite de % mini-apps do seu plano atingido. Faça upgrade para adicionar mais.', v_limit;
    end if;
  end if;
  return new;
end;
$$;

create trigger mini_apps_enforce_limit
  before insert on public.mini_apps
  for each row
  execute function public.enforce_mini_app_limit();

create or replace function public.enforce_product_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer;
  v_count integer;
begin
  select p.max_products into v_limit
  from public.tenants t join public.plans p on p.key = t.plan_key
  where t.id = new.tenant_id;

  if v_limit is not null then
    select count(*) into v_count from public.products where tenant_id = new.tenant_id;
    if v_count >= v_limit then
      raise exception 'Limite de % produtos do seu plano atingido. Faça upgrade para adicionar mais.', v_limit;
    end if;
  end if;
  return new;
end;
$$;

create trigger products_enforce_limit
  before insert on public.products
  for each row
  execute function public.enforce_product_limit();
