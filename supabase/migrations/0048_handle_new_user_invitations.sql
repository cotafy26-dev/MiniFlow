-- MiniFlow — Convite de membro
-- Extends handle_new_user() (0005) — same trigger, same signature — to
-- check for a pending invitation (matched by a token carried in signup
-- metadata) before falling back to the original "always create a new
-- tenant" behavior. Everything below the `else` is byte-for-byte the
-- original 0005 body, unchanged.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name    text;
  v_tenant_name  text;
  v_slug         text;
  v_tenant_id    uuid;
  v_admin_role   uuid;
  v_invite_token text;
  v_invite       record;
begin
  v_full_name := coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1));
  v_invite_token := new.raw_user_meta_data ->> 'invitation_token';

  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, v_full_name);

  if v_invite_token is not null then
    select * into v_invite from public.invitations
      where token = v_invite_token and status = 'pending' and expires_at > now();
  end if;

  if v_invite is not null then
    insert into public.tenant_memberships (tenant_id, user_id, role_id, status, is_tenant_owner)
    values (v_invite.tenant_id, new.id, v_invite.role_id, 'active', false);

    update public.invitations set status = 'accepted' where id = v_invite.id;
    update public.profiles set default_tenant_id = v_invite.tenant_id where id = new.id;
  else
    v_tenant_name := coalesce(new.raw_user_meta_data ->> 'tenant_name', v_full_name || '''s Workspace');
    v_slug := lower(regexp_replace(v_tenant_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(new.id::text, 1, 8);

    insert into public.tenants (name, slug, owner_id)
    values (v_tenant_name, v_slug, new.id)
    returning id into v_tenant_id;

    insert into public.tenant_settings (tenant_id) values (v_tenant_id);

    select id into v_admin_role from public.roles where key = 'admin';

    insert into public.tenant_memberships (tenant_id, user_id, role_id, status, is_tenant_owner)
    values (v_tenant_id, new.id, v_admin_role, 'active', true);

    update public.profiles set default_tenant_id = v_tenant_id where id = new.id;
  end if;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'AFTER INSERT ON auth.users: if raw_user_meta_data has a valid pending invitation_token, joins that tenant with the invited role; otherwise provisions a brand-new tenant + owner membership, same as before invitations existed.';
