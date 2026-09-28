-- MiniFlow — Fase 3
-- modules and lessons: Produto → Módulo → Aula. Both carry tenant_id (and
-- lessons additionally product_id) directly rather than being reached
-- only through joins — mirrors mini_apps/mini_app_categories, keeping
-- every RLS policy and query a flat column comparison.
--
-- modules have no status of their own — purely an ordering/grouping
-- container, visible whenever its product is. Only lessons carry a
-- draft/published workflow.
--
-- lessons.content_type covers all 8 spec kinds via discrete typed columns
-- (mirrors mini_apps' url/content_html split); quiz_data is the one jsonb
-- column, reserved only for quiz's inherently variable-length question list.

create table public.modules (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  name        text not null,
  description text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index modules_tenant_idx on public.modules (tenant_id);
create index modules_product_idx on public.modules (product_id, sort_order);

create trigger set_modules_updated_at
  before update on public.modules
  for each row execute function public.set_updated_at();

alter table public.modules enable row level security;
alter table public.modules force row level security;

create table public.lessons (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  product_id   uuid not null references public.products(id) on delete cascade,
  module_id    uuid not null references public.modules(id) on delete cascade,
  name         text not null,
  description  text,
  content_type text not null default 'text'
                 check (content_type in
                   ('video', 'text', 'image', 'pdf', 'audio', 'link', 'file', 'quiz')),
  video_url    text,  -- content_type='video' — raw URL, parsed client-side by <VideoPlayer>
  body_text    text,  -- content_type='text' — plain text only, never HTML/dangerouslySetInnerHTML
  image_url    text,  -- content_type='image'
  file_url     text,  -- content_type in ('pdf','audio','file') — shared, mirrors mini_apps.url reuse
  link_url     text,  -- content_type='link'
  quiz_data    jsonb, -- content_type='quiz' — {"questions":[{"id","prompt","options":string[4],"correctIndex"}]}
  status       text not null default 'draft' check (status in ('draft', 'published')),
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint lessons_content_required_when_published check (
    status <> 'published' or (
      (content_type = 'video' and video_url is not null) or
      (content_type = 'text'  and body_text is not null) or
      (content_type = 'image' and image_url is not null) or
      (content_type = 'pdf'   and file_url is not null) or
      (content_type = 'audio' and file_url is not null) or
      (content_type = 'file'  and file_url is not null) or
      (content_type = 'link'  and link_url is not null) or
      (content_type = 'quiz'  and quiz_data is not null)
    )
  )
);

create index lessons_tenant_idx on public.lessons (tenant_id);
create index lessons_product_idx on public.lessons (product_id, status);
create index lessons_module_idx on public.lessons (module_id, sort_order);

create trigger set_lessons_updated_at
  before update on public.lessons
  for each row execute function public.set_updated_at();

alter table public.lessons enable row level security;
alter table public.lessons force row level security;

-- Mirrors can_view_product()'s pattern for the one level below it.
create or replace function public.can_view_lesson(p_lesson_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin() or exists (
    select 1 from public.lessons l
    where l.id = p_lesson_id
      and l.status = 'published'
      and public.can_view_product(l.product_id)
  );
$$;

comment on function public.can_view_lesson(uuid) is
  'True if Super Admin, or the lesson is published and can_view_product() allows its parent product.';

create policy "modules_manage" on public.modules
  for all to authenticated
  using (public.is_super_admin() or public.has_permission(tenant_id, 'products.manage'))
  with check (public.is_super_admin() or public.has_permission(tenant_id, 'products.manage'));

create policy "modules_select_visible" on public.modules
  for select to authenticated
  using (public.can_view_product(product_id));

create policy "lessons_manage" on public.lessons
  for all to authenticated
  using (public.is_super_admin() or public.has_permission(tenant_id, 'products.manage'))
  with check (public.is_super_admin() or public.has_permission(tenant_id, 'products.manage'));

create policy "lessons_select_visible" on public.lessons
  for select to authenticated
  using (public.can_view_lesson(id));
