-- MiniFlow — Fase 5
-- The project's first function granted to the `anon` role — the public
-- certificate-verification page (/certificate/[code]) has no session.
-- Returns only what's safe to disclose publicly; never exposes the raw
-- certificates table to anon via RLS.

create or replace function public.verify_certificate(p_certificate_number text)
returns table (student_name text, product_name text, tenant_name text, issued_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select p.full_name, pr.name, t.name, c.issued_at
  from public.certificates c
  join public.profiles p on p.id = c.user_id
  join public.products pr on pr.id = c.product_id
  join public.tenants t on t.id = c.tenant_id
  where c.certificate_number = p_certificate_number;
$$;

comment on function public.verify_certificate(text) is
  'Only function in the project granted to anon — backs the public /certificate/[code] page. Returns just student name, course name, tenant name and issue date; never the raw certificates row.';

grant execute on function public.verify_certificate(text) to anon, authenticated;
