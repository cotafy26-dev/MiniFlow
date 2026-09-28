-- MiniFlow — Fase 2
-- Adds static HTML content support to mini_apps for the 'internal_page'
-- type — the admin pastes HTML/CSS (no build step, no server tool
-- required) and it's rendered at /apps/[slug] inside a fully sandboxed
-- iframe (via srcDoc, sandbox="" — scripts, forms, popups and same-origin
-- access all disabled). This keeps admin-authored markup from ever being
-- able to touch the signed-in viewer's session/cookies, even if it
-- contains a malicious <script> tag.
--
-- Length-capped at the application layer (see
-- src/lib/validations/mini-apps.ts) — no DB-level constraint needed since
-- this is just content storage, not a security boundary itself.

alter table public.mini_apps add column content_html text;
