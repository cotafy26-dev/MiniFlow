-- MiniFlow — Fase 8 (Notificações Push)
-- push_subscriptions: one row per (user, browser) Web Push registration.
-- Self-only RLS — a subscription isn't tenant data. Sending a
-- notification legitimately needs to read someone ELSE's subscriptions
-- (the recipient, not the actor who triggered it), so that path uses
-- createAdminClient() (service-role) instead of a broader policy here.

create table public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth_key   text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
alter table public.push_subscriptions force row level security;

create policy "push_subscriptions_self" on public.push_subscriptions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
