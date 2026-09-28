-- MiniFlow — Fase 4 (E-mails)
-- Per-tenant customization of the welcome email's subject/body (null =
-- use the built-in default template). No new RLS policy needed:
-- tenant_settings_update (tenant.settings.manage, 0009) already covers
-- these two new columns.
alter table public.tenant_settings
  add column welcome_email_subject text,
  add column welcome_email_body text;

-- Idempotency flag so the callback route (hit on every Google OAuth
-- login, not just the first) sends the welcome email exactly once per
-- user. profiles_update_self (id = auth.uid(), 0005) already covers it.
alter table public.profiles
  add column welcome_email_sent_at timestamptz;
