# src/modules

Placeholder for Fase 3+ feature modules: Produtos, Conteúdo/Cursos, Comunidade,
Feed, Gamificação, Notificações, IA, Certificados, Integrações/Webhooks.

## Contract

Each module is self-contained and owns:

- `components/` — its own UI, not shared outside the module
- `queries.ts` / `actions.ts` — its own data access (server-only)
- its own `supabase/migrations/*.sql` entries (additive — never edits a
  Fase 1 core table's columns, only adds new tables that reference them)
- its own entry in `src/core/navigation/nav-items.ts`

A module may **read** `src/core` exports (`requireTenantContext`,
`requirePermission`, `logActivity`, the Supabase client factories) but must
never reach into another module's internals. `src/core` never imports from
`src/modules` — dependencies point one way, core inward, modules outward.
