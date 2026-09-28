-- MiniFlow — Fase 4
-- MVP scope: "compartilhar internamente" is a counter/log, not a repost
-- into the feed. Unique per (post, user) — repeat shares don't multiply
-- the count, sharing again just confirms it stayed shared.

create table public.post_shares (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create index post_shares_post_idx on public.post_shares (post_id);

alter table public.post_shares enable row level security;
alter table public.post_shares force row level security;

create policy "post_shares_select" on public.post_shares
  for select to authenticated
  using (public.is_super_admin() or public.can_view_post(post_id));

create policy "post_shares_insert" on public.post_shares
  for insert to authenticated
  with check (user_id = auth.uid() and public.can_view_post(post_id));

create policy "post_shares_delete" on public.post_shares
  for delete to authenticated
  using (user_id = auth.uid());
