-- MiniFlow — Fase 3
-- lesson_progress: row existence = completion, no boolean column. Marking
-- complete is an insert (ON CONFLICT DO NOTHING); unmarking is a delete.
-- product_id/module_id are denormalized from the lesson's ancestry purely
-- so "X of Y aulas concluídas" is a flat count query, no join needed.

create table public.lesson_progress (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  product_id   uuid not null references public.products(id) on delete cascade,
  module_id    uuid not null references public.modules(id) on delete cascade,
  lesson_id    uuid not null references public.lessons(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create index lesson_progress_user_product_idx on public.lesson_progress (user_id, product_id);
create index lesson_progress_lesson_idx on public.lesson_progress (lesson_id);

alter table public.lesson_progress enable row level security;
alter table public.lesson_progress force row level security;

create policy "lesson_progress_select" on public.lesson_progress
  for select to authenticated
  using (
    public.is_super_admin()
    or public.has_permission(tenant_id, 'products.manage')
    or user_id = auth.uid()
  );

-- Only the row's own owner may ever write it, and only for a lesson they
-- can currently see. No delete-time can_view_lesson() check: revoking
-- access later does NOT retroactively erase already-earned progress. No
-- update policy at all — the app never updates a row in place, only
-- inserts or deletes it.
create policy "lesson_progress_insert" on public.lesson_progress
  for insert to authenticated
  with check (user_id = auth.uid() and public.can_view_lesson(lesson_id));

create policy "lesson_progress_delete" on public.lesson_progress
  for delete to authenticated
  using (user_id = auth.uid());
