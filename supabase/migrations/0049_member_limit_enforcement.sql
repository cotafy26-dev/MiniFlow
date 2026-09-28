-- MiniFlow — Convite de membro
-- Closes the plans.max_members enforcement gap Fase 7 (0043/0044) left
-- open deliberately, since no member-insert path existed yet — the
-- invite-accept flow is that path. Same trigger-guard shape as
-- enforce_mini_app_limit/enforce_product_limit (0044).

create or replace function public.enforce_member_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer;
  v_count integer;
begin
  select p.max_members into v_limit
  from public.tenants t join public.plans p on p.key = t.plan_key
  where t.id = new.tenant_id;

  if v_limit is not null then
    select count(*) into v_count from public.tenant_memberships where tenant_id = new.tenant_id;
    if v_count >= v_limit then
      raise exception 'Limite de % membros do seu plano atingido. Faça upgrade para adicionar mais.', v_limit;
    end if;
  end if;
  return new;
end;
$$;

create trigger tenant_memberships_enforce_limit
  before insert on public.tenant_memberships
  for each row
  execute function public.enforce_member_limit();
