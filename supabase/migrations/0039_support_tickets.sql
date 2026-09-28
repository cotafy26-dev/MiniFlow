-- MiniFlow — Fase 4 (Suporte)
-- support_tickets + support_ticket_messages: a member opens a ticket,
-- staff (support.manage) answers it in a queue. "Is this the staff side of
-- the conversation?" is derived at read time (message.author_id vs
-- ticket.user_id) instead of stored — one less column to keep honest.

create table public.support_tickets (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  subject          text not null,
  status           text not null default 'open'
                     check (status in ('open', 'in_progress', 'resolved', 'closed')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  last_message_at  timestamptz not null default now()
);

create index support_tickets_tenant_status_idx on public.support_tickets (tenant_id, status, last_message_at desc);
create index support_tickets_user_idx on public.support_tickets (user_id);

create trigger set_support_tickets_updated_at
  before update on public.support_tickets
  for each row
  execute function public.set_updated_at();

alter table public.support_tickets enable row level security;
alter table public.support_tickets force row level security;

create policy "support_tickets_select" on public.support_tickets
  for select to authenticated
  using (
    public.is_super_admin()
    or public.has_permission(tenant_id, 'support.manage')
    or user_id = auth.uid()
  );

create policy "support_tickets_insert" on public.support_tickets
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_active_tenant_member(tenant_id));

-- Staff can change anything on a ticket (status, mainly); the opener can
-- also update their own (close/reopen it themselves). The app layer only
-- ever sends `status` down this path — never trusted further than that,
-- same discipline as posts_moderate_update.
create policy "support_tickets_update" on public.support_tickets
  for update to authenticated
  using (
    public.is_super_admin()
    or public.has_permission(tenant_id, 'support.manage')
    or user_id = auth.uid()
  )
  with check (
    public.is_super_admin()
    or public.has_permission(tenant_id, 'support.manage')
    or user_id = auth.uid()
  );

create table public.support_ticket_messages (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  ticket_id  uuid not null references public.support_tickets(id) on delete cascade,
  author_id  uuid not null references auth.users(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);

create index support_ticket_messages_ticket_idx on public.support_ticket_messages (ticket_id, created_at);

alter table public.support_ticket_messages enable row level security;
alter table public.support_ticket_messages force row level security;

create or replace function public.can_view_ticket(p_ticket_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin() or exists (
    select 1 from public.support_tickets t where t.id = p_ticket_id and (
      public.has_permission(t.tenant_id, 'support.manage') or t.user_id = auth.uid()
    )
  );
$$;

comment on function public.can_view_ticket(uuid) is
  'Visibility rule for one ticket''s messages: Super Admin, support.manage staff, or the ticket''s own opener. Mirrors can_view_post().';

create policy "support_ticket_messages_select" on public.support_ticket_messages
  for select to authenticated using (public.can_view_ticket(ticket_id));

create policy "support_ticket_messages_insert" on public.support_ticket_messages
  for insert to authenticated
  with check (author_id = auth.uid() and public.can_view_ticket(ticket_id));
