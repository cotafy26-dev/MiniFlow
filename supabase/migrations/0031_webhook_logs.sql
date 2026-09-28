-- MiniFlow — Fase 7
-- Audit trail for every webhook received: date, event, payload, status,
-- response, error. tenant_id/integration_id are nullable because a
-- webhook hitting an unknown/deleted integration id must still be logged
-- (otherwise the failure is invisible).

create table public.webhook_logs (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid references public.tenants(id) on delete cascade,
  integration_id  uuid references public.integrations(id) on delete set null,
  provider        text not null,
  event_type      text,
  payload         jsonb not null default '{}'::jsonb,
  status          text not null check (status in ('processed', 'ignored', 'error')),
  error_message   text,
  response_status integer not null,
  created_at      timestamptz not null default now()
);

create index webhook_logs_tenant_created_idx on public.webhook_logs (tenant_id, created_at desc);

alter table public.webhook_logs enable row level security;
alter table public.webhook_logs force row level security;

-- No insert policy for `authenticated`: only the webhook Route Handler
-- writes here, via createAdminClient() (service-role, bypasses RLS) —
-- there's no authenticated-session path that should ever write this, not
-- even indirectly. Unlike activity_logs, not even a SECURITY DEFINER RPC
-- makes sense here: there's no auth.uid() in an external webhook request
-- to validate against tenant_memberships the way log_activity() does.
create policy "webhook_logs_select" on public.webhook_logs
  for select to authenticated
  using (public.is_super_admin() or public.has_permission(tenant_id, 'integrations.manage'));
