-- MiniFlow — Fase 5
-- Auto-issued when a user completes every published lesson of a product.
-- issue_certificate_if_eligible() is idempotent via the unique constraint
-- below — re-completing (e.g. after unmarking and remarking a lesson)
-- never issues a second certificate.

create table public.certificates (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references public.tenants(id) on delete cascade,
  user_id             uuid not null references auth.users(id) on delete cascade,
  product_id          uuid not null references public.products(id) on delete cascade,
  certificate_number  text not null unique,
  issued_at           timestamptz not null default now(),
  unique (tenant_id, user_id, product_id)
);

create index certificates_user_idx on public.certificates (user_id);

alter table public.certificates enable row level security;
alter table public.certificates force row level security;

create policy "certificates_select" on public.certificates
  for select to authenticated
  using (
    public.is_super_admin()
    or public.has_permission(tenant_id, 'gamification.manage')
    or user_id = auth.uid()
  );

-- Manual issuance by an admin (exceptional cases); automatic issuance
-- (issue_certificate_if_eligible) bypasses RLS like the functions above.
create policy "certificates_manage" on public.certificates
  for all to authenticated
  using (public.is_super_admin() or public.has_permission(tenant_id, 'gamification.manage'))
  with check (public.is_super_admin() or public.has_permission(tenant_id, 'gamification.manage'));

create or replace function public.issue_certificate_if_eligible(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id      uuid;
  v_total_lessons  integer;
  v_completed      integer;
  v_code           text;
begin
  select tenant_id into v_tenant_id from public.products where id = p_product_id;
  if v_tenant_id is null then return; end if;

  select count(*) into v_total_lessons
  from public.lessons where product_id = p_product_id and status = 'published';
  if v_total_lessons = 0 then return; end if;

  select count(*) into v_completed
  from public.lesson_progress lp
  join public.lessons l on l.id = lp.lesson_id and l.status = 'published'
  where lp.product_id = p_product_id and lp.user_id = auth.uid();

  if v_completed < v_total_lessons then return; end if;

  v_code := upper(substring(replace(gen_random_uuid()::text, '-', '') for 12));

  insert into public.certificates (tenant_id, user_id, product_id, certificate_number)
  values (v_tenant_id, auth.uid(), p_product_id, v_code)
  on conflict (tenant_id, user_id, product_id) do nothing;
end;
$$;

comment on function public.issue_certificate_if_eligible(uuid) is
  'Called from setLessonProgressAction right after marking a lesson complete. Checks whether every published lesson of the product is now complete for the caller, and if so issues a certificate (once — the unique (tenant_id, user_id, product_id) constraint makes this idempotent).';
