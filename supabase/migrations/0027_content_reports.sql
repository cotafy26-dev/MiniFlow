-- MiniFlow — Fase 4
-- Denúncias, for posts and comments. Named content_reports (not the bare
-- "reports") to avoid ambiguity with a possible future analytics/reports
-- feature. No delete policy: reports stay as a permanent audit trail.

create table public.content_reports (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment')),
  target_id   uuid not null,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason      text not null,
  status      text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz,
  created_at  timestamptz not null default now()
);

create index content_reports_tenant_status_idx on public.content_reports (tenant_id, status);
create index content_reports_target_idx on public.content_reports (target_type, target_id);

alter table public.content_reports enable row level security;
alter table public.content_reports force row level security;

create policy "content_reports_select" on public.content_reports
  for select to authenticated
  using (
    public.is_super_admin()
    or public.has_permission(tenant_id, 'community.moderate')
    or reporter_id = auth.uid()
  );

create policy "content_reports_insert" on public.content_reports
  for insert to authenticated
  with check (
    reporter_id = auth.uid() and (
      (target_type = 'post' and public.can_view_post(target_id))
      or (target_type = 'comment' and public.can_view_comment(target_id))
    )
  );

create policy "content_reports_moderate_update" on public.content_reports
  for update to authenticated
  using (public.is_super_admin() or public.has_permission(tenant_id, 'community.moderate'))
  with check (public.is_super_admin() or public.has_permission(tenant_id, 'community.moderate'));
