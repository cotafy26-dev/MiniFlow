-- MiniFlow — Fase 1
-- Final RLS policies for tables whose dependencies (current_tenant_id,
-- has_permission) weren't ready when they were created.

create policy "tenants_select" on public.tenants
  for select to authenticated
  using (
    public.is_super_admin()
    or id = public.current_tenant_id()
    or exists (
      select 1 from public.tenant_memberships tm
      where tm.tenant_id = tenants.id and tm.user_id = auth.uid()
    )
  );

create policy "tenants_update" on public.tenants
  for update to authenticated
  using (
    public.is_super_admin()
    or (id = public.current_tenant_id() and public.has_permission(id, 'tenant.settings.manage'))
  )
  with check (
    public.is_super_admin()
    or (id = public.current_tenant_id() and public.has_permission(id, 'tenant.settings.manage'))
  );
-- No insert policy for `authenticated`: tenants are only created by
-- handle_new_user() (SECURITY DEFINER) or, later, a Super Admin panel
-- using the service-role client.

create policy "tenant_memberships_select" on public.tenant_memberships
  for select to authenticated
  using (
    public.is_super_admin()
    or user_id = auth.uid()
    or public.has_permission(tenant_id, 'members.view')
  );

create policy "tenant_memberships_write" on public.tenant_memberships
  for all to authenticated
  using (
    public.is_super_admin()
    or public.has_permission(tenant_id, 'members.manage')
  )
  with check (
    public.is_super_admin()
    or public.has_permission(tenant_id, 'members.manage')
  );

create policy "tenant_settings_select" on public.tenant_settings
  for select to authenticated
  using (
    public.is_super_admin()
    or tenant_id = public.current_tenant_id()
  );

create policy "tenant_settings_update" on public.tenant_settings
  for update to authenticated
  using (
    public.is_super_admin()
    or public.has_permission(tenant_id, 'tenant.settings.manage')
  )
  with check (
    public.is_super_admin()
    or public.has_permission(tenant_id, 'tenant.settings.manage')
  );
-- No insert/delete policy for `authenticated`: tenant_settings rows are
-- only ever created by handle_new_user() and deleted via the tenants
-- cascade.
