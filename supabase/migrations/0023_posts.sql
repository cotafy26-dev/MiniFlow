-- MiniFlow — Fase 4
-- One table backs both Feed (community_id is null, admin-authored
-- broadcast) and Comunidade posts (community_id set, member-authored) —
-- avoids duplicating comments/likes/shares/reports twice over.

create table public.posts (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  community_id uuid references public.communities(id) on delete cascade,
  author_id    uuid not null references auth.users(id) on delete cascade,
  content_type text not null default 'text'
                 check (content_type in ('text', 'image', 'video', 'link', 'announcement', 'news')),
  body_text    text,
  image_url    text,
  video_url    text,
  link_url     text,
  is_pinned    boolean not null default false,
  status       text not null default 'published' check (status in ('published', 'hidden')),
  deleted_by   uuid references auth.users(id),
  deleted_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 'announcement'/'news' are Feed-broadcast formats; app-layer (zod)
-- restricts them to community_id is null — same "DB allows more than the
-- UI exposes" pattern as lessons.content_type vs the lesson form.
create index posts_tenant_feed_idx on public.posts (tenant_id, created_at desc) where community_id is null;
create index posts_community_idx on public.posts (community_id, created_at desc);

create trigger set_posts_updated_at
  before update on public.posts
  for each row
  execute function public.set_updated_at();

-- Pin/unpin can't be expressed as a column-level restriction in a USING
-- clause, so a trigger blocks flipping is_pinned outside the
-- publish/moderate path (stops a regular member self-pinning their own
-- community post via the author-write policy below).
create or replace function public.posts_guard_pin()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.is_pinned is distinct from old.is_pinned
     and not (
       public.is_super_admin()
       or public.has_permission(new.tenant_id, 'feed.publish')
       or public.has_permission(new.tenant_id, 'community.moderate')
     )
  then
    raise exception 'Sem permissão para fixar/desfixar este post.';
  end if;
  return new;
end;
$$;

create trigger posts_guard_pin
  before update on public.posts
  for each row
  execute function public.posts_guard_pin();

alter table public.posts enable row level security;
alter table public.posts force row level security;

create or replace function public.can_view_post(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin() or exists (
    select 1 from public.posts p where p.id = p_post_id and (
      public.has_permission(p.tenant_id, 'community.moderate')
      or public.has_permission(p.tenant_id, 'feed.publish')
      or public.has_permission(p.tenant_id, 'community.manage')
      or p.author_id = auth.uid()
      or (p.status = 'published' and (
            (p.community_id is null and public.is_active_tenant_member(p.tenant_id))
            or (p.community_id is not null and public.is_community_member(p.community_id))
          ))
    )
  );
$$;

comment on function public.can_view_post(uuid) is
  'Visibility rule for one post: Super Admin, a moderator/publisher/manager, its own author, or (if published) any active tenant member for a Feed post / any active community member for a community post. community.manage is included so a community''s administrator can always preview its content even before joining it. Reused by comments/likes/shares/reports RLS instead of re-deriving it.';

create policy "posts_select" on public.posts
  for select to authenticated using (public.can_view_post(id));

create policy "posts_insert" on public.posts
  for insert to authenticated
  with check (
    author_id = auth.uid() and (
      (community_id is null and (public.is_super_admin() or public.has_permission(tenant_id, 'feed.publish')))
      or (community_id is not null and public.is_community_member(community_id))
    )
  );

-- Author owns their own row fully: edit content, or hard-delete it
-- (cascades their own comments/likes/shares away with it).
create policy "posts_author_write" on public.posts
  for all to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

-- Moderators/publishers may UPDATE any row — app layer only ever touches
-- status/is_pinned/deleted_by/deleted_at here (never trusted blindly, same
-- discipline as setLessonProgressAction). Deliberately no DELETE policy for
-- them: soft-hide only, preserving evidence for reports.
create policy "posts_moderate_update" on public.posts
  for update to authenticated
  using (
    public.is_super_admin()
    or public.has_permission(tenant_id, 'community.moderate')
    or public.has_permission(tenant_id, 'feed.publish')
  )
  with check (
    public.is_super_admin()
    or public.has_permission(tenant_id, 'community.moderate')
    or public.has_permission(tenant_id, 'feed.publish')
  );
