# src/apps

Placeholder for Fase 2+ mini-apps — the pluggable, individually
cadastrable apps end users open from the dashboard's "Meus Mini Apps"
grid (see `src/components/dashboard/mini-apps-slot.tsx`).

## Contract

Each mini-app is a self-contained folder:

```
src/apps/<slug>/
  page.tsx        # or a route segment under app/(dashboard)/apps/<slug>/
  components/
  queries.ts / actions.ts
```

A mini-app may read `src/core` exports (auth/tenant context, permission
guards, activity log) but never reaches into another mini-app's internals,
and the platform core never imports from `src/apps` — mini-apps register
themselves into the catalog (a Fase 2 `mini_apps` table, cadastrado pelo
admin) and into `src/core/navigation/nav-items.ts`; they are not
hard-wired into `src/core`.

Mini-app types per the product spec: app interno, página interna,
aplicação externa (iframe/link), PWA, ferramenta de IA — the `mini_apps`
table's `type` column (Fase 2) decides which of these a given folder here
implements.
