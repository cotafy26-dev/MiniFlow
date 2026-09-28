-- MiniFlow — Fase 4
-- Generic likes for both posts and comments — one table, avoids
-- duplicating post_likes/comment_likes. Row existence = "liked"; toggling
-- is insert/delete only, no update policy (mirrors lesson_progress's idiom).

create table public.likes (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment')),
  -- No FK: polymorphic target (post or comment id). Visibility is
  -- enforced by RLS via can_view_post/can_view_comment, not by a
  -- reference constraint.
  target_id   uuid not null,
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (target_type, target_id, user_id)
);

create index likes_target_idx on public.likes (target_type, target_id);
create index likes_user_idx on public.likes (user_id);

alter table public.likes enable row level security;
alter table public.likes force row level security;

create policy "likes_select" on public.likes
  for select to authenticated
  using (
    public.is_super_admin()
    or (target_type = 'post' and public.can_view_post(target_id))
    or (target_type = 'comment' and public.can_view_comment(target_id))
  );

create policy "likes_insert" on public.likes
  for insert to authenticated
  with check (
    user_id = auth.uid() and (
      (target_type = 'post' and public.can_view_post(target_id))
      or (target_type = 'comment' and public.can_view_comment(target_id))
    )
  );

create policy "likes_delete" on public.likes
  for delete to authenticated
  using (user_id = auth.uid());
