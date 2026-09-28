-- MiniFlow — Fase 4
-- Comments on posts, with one level of replies (parent_comment_id). A
-- CHECK constraint can't subquery its own table, so a trigger enforces
-- the one-level rule instead.

create table public.comments (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  post_id           uuid not null references public.posts(id) on delete cascade,
  author_id         uuid not null references auth.users(id) on delete cascade,
  parent_comment_id uuid references public.comments(id) on delete cascade,
  body              text not null,
  status            text not null default 'published' check (status in ('published', 'hidden')),
  deleted_by        uuid references auth.users(id),
  deleted_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index comments_post_idx on public.comments (post_id, created_at);
create index comments_parent_idx on public.comments (parent_comment_id);

create trigger set_comments_updated_at
  before update on public.comments
  for each row
  execute function public.set_updated_at();

create or replace function public.comments_enforce_one_level()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.parent_comment_id is not null and exists (
    select 1 from public.comments pc
    where pc.id = new.parent_comment_id and pc.parent_comment_id is not null
  ) then
    raise exception 'Respostas só têm um nível — não é possível responder a uma resposta.';
  end if;
  return new;
end;
$$;

create trigger comments_guard_one_level
  before insert or update on public.comments
  for each row
  execute function public.comments_enforce_one_level();

alter table public.comments enable row level security;
alter table public.comments force row level security;

create or replace function public.can_view_comment(p_comment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin() or exists (
    select 1 from public.comments c where c.id = p_comment_id and (
      public.has_permission(c.tenant_id, 'community.moderate')
      or c.author_id = auth.uid()
      or (c.status = 'published' and public.can_view_post(c.post_id))
    )
  );
$$;

comment on function public.can_view_comment(uuid) is
  'Visibility rule for one comment: Super Admin, a moderator, its own author, or (if published) anyone who can view the parent post. Reused by likes/reports RLS.';

create policy "comments_select" on public.comments
  for select to authenticated using (public.can_view_comment(id));

create policy "comments_insert" on public.comments
  for insert to authenticated
  with check (author_id = auth.uid() and public.can_view_post(post_id));

create policy "comments_author_write" on public.comments
  for all to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "comments_moderate_update" on public.comments
  for update to authenticated
  using (public.is_super_admin() or public.has_permission(tenant_id, 'community.moderate'))
  with check (public.is_super_admin() or public.has_permission(tenant_id, 'community.moderate'));
