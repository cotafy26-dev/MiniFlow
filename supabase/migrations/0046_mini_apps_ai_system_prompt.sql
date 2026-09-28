-- MiniFlow — Fase 6 (IA)
-- Backs the 'ai_tool' mini_apps.type, which has existed since Fase 2
-- (0012_mini_apps.sql) but was never wired to real behavior — the admin
-- could already pick it in the form, it just fell through to a generic
-- "coming soon" placeholder. This is the system prompt/persona the admin
-- configures for that tool. Nullable, no new policy needed: mini_apps_manage
-- and mini_apps_select_visible (0012) already cover every column.
alter table public.mini_apps add column ai_system_prompt text;
