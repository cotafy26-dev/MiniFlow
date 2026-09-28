# MiniFlow

Hub de mini-apps + área de membros — SaaS multi-tenant. Fase 1: projeto,
banco, autenticação, usuários, roles, multi-tenant e o shell do dashboard.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 + shadcn/ui
(Base UI) · Supabase (Postgres + Auth + Storage) · react-hook-form + zod ·
TanStack Query · Serwist (PWA).

## Pré-requisitos

- Node.js 22+
- Uma conta e um projeto em [supabase.com](https://supabase.com)

## Configuração

1. **Instale as dependências**

   ```bash
   npm install
   ```

2. **Crie um projeto no Supabase** (dashboard.supabase.com) e copie, em
   *Project Settings → API*: a Project URL, a `anon` key e a
   `service_role` key. Em *Project Settings → Database → Connection
   string → URI*, copie a connection string.

3. **Preencha `.env.local`** (copie de `.env.example` se necessário):

   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   DATABASE_URL=
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. **Aplique as migrations** (`supabase/migrations/0001..0009_*.sql`).
   Com a Supabase CLI vinculada ao projeto (`npx supabase link`):

   ```bash
   npm run db:push
   ```

   Ou cole o conteúdo de cada arquivo, em ordem, no SQL Editor do
   dashboard do Supabase.

5. **Confirmação de e-mail**: no dashboard, em *Authentication →
   Providers → Email*, deixe "Confirm email" ativado (padrão da Fase 1).
   Configure também um provedor SMTP em *Authentication → Emails →
   SMTP Settings* para os e-mails de confirmação/redefinição de senha
   saírem de verdade (sem isso, o Supabase usa um limite baixíssimo de
   envio, só ok para teste).

6. **Login com Google (opcional na Fase 1)**: crie credenciais OAuth no
   [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   (tipo "Web application"), com Authorized redirect URI:
   `https://<project-ref>.supabase.co/auth/v1/callback`. No dashboard do
   Supabase, em *Authentication → Providers → Google*, cole o Client ID e
   o Client Secret e ative o provedor.

7. **Rode o app**

   ```bash
   npm run dev
   ```

   Abra [http://localhost:3000](http://localhost:3000), crie uma conta em
   `/register` e confirme o e-mail.

8. **Promova sua conta a Super Admin** (não há UI para isso na Fase 1):

   ```bash
   node scripts/create-super-admin.mjs voce@exemplo.com
   ```

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm run start` | Build e start de produção |
| `npm run lint` / `npm run typecheck` | Lint e checagem de tipos |
| `npm run db:types` | Gera `src/types/database.ts` a partir do projeto Supabase vinculado |
| `npm run db:push` | Aplica migrations pendentes ao projeto vinculado |
| `npm run db:reset` | Reseta o banco local (Supabase CLI + Docker) e roda `supabase/seed.sql` |
| `node scripts/create-super-admin.mjs <email>` | Promove uma conta existente a Super Admin |

## Arquitetura

- `src/core/` — domínio estável: auth, tenants, permissions, activity-log,
  navigation. Único módulo que fala diretamente com Supabase para
  autenticação/contexto de tenant.
- `src/modules/` — placeholder para os módulos das próximas fases
  (Produtos, Conteúdo, Comunidade, Gamificação, IA, ...). Veja
  `src/modules/README.md` para o contrato de extensão.
- `src/apps/` — placeholder para os mini-apps individuais (Fase 2+). Veja
  `src/apps/README.md`.
- `supabase/migrations/` — schema versionado. Multi-tenant via Row Level
  Security (RLS) em todas as tabelas com `tenant_id`; `current_tenant_id()`
  e `has_permission()` (em `0006_tenant_memberships.sql`) são a base de
  toda policy.

## Segurança

- `SUPABASE_SERVICE_ROLE_KEY` e `DATABASE_URL` nunca são lidos fora de
  `src/lib/supabase/server.ts` (`createAdminClient()`) e `scripts/*.mjs`.
  Nunca os exponha com o prefixo `NEXT_PUBLIC_`.
- Toda tabela com `tenant_id` tem RLS habilitado e forçado
  (`force row level security`) — o isolamento entre tenants é garantido
  pelo Postgres, não apenas pela aplicação.
- `activity_logs` não tem policy de INSERT: toda escrita passa pela
  função `log_activity()`.

## Nota sobre dependências

`@serwist/next` está fixado em `9.4.1` (em vez da versão mais recente,
`9.5.12`) porque essa versão traz uma dependência transitiva do
`browserslist` com uma vulnerabilidade conhecida (`npm audit`). Reavalie
ao atualizar dependências.

## Status

Fase 1 concluída: projeto, banco, autenticação (e-mail/senha + Google
OAuth), roles/permissions, isolamento multi-tenant via RLS, shell do
dashboard responsivo, PWA scaffold. Próxima fase (Fase 2): cadastro e
catálogo de mini-apps.
