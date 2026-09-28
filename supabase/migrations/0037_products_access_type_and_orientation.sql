-- MiniFlow — melhoria no formulário de Produtos
-- Additive, same pattern as 0013_mini_apps_content_html.sql: two new
-- columns on an existing table, nothing else changes. access_type is a
-- classification only (see core/products/actions.ts / product-form.tsx
-- comments) — it does not itself grant access; card_orientation only
-- affects how ProductCard renders the cover image aspect ratio.

alter table public.products
  add column access_type text not null default 'free' check (access_type in ('free', 'paid')),
  add column card_orientation text not null default 'square' check (card_orientation in ('square', 'vertical', 'horizontal'));
