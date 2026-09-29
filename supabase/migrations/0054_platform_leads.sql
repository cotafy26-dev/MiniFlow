-- Interessados na assinatura da própria plataforma MedFlow System (não é
-- por tenant — é o dono do SaaS vendendo o SaaS). Capturado pela página
-- pública /planos; sem fluxo de pagamento automático ainda, por isso só
-- guarda o lead e notifica por e-mail — o super admin confirma o
-- pagamento por fora e libera o acesso manualmente.

create table public.platform_leads (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  whatsapp   text not null,
  message    text,
  status     text not null default 'new' check (status in ('new', 'contacted', 'converted', 'discarded')),
  created_at timestamptz not null default now()
);

alter table public.platform_leads enable row level security;
alter table public.platform_leads force row level security;

create policy "platform_leads_super_admin_select" on public.platform_leads
  for select to authenticated
  using (public.is_super_admin());
