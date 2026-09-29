-- MedFlow System — "Site hospedado" passa a ser servido por caminho
-- (medflowsystem.com/site/<site_path>) em vez de subdomínio dedicado.
--
-- Motivo: no plano de hospedagem atual (Hostinger, produto "Websites"),
-- certificado SSL wildcard (*.medflowsystem.com) só existe em planos VPS —
-- cada subdomínio precisaria ter SSL emitido manualmente no painel, o que
-- inviabiliza o autoatendimento (cliente cria o site e o subdomínio dele
-- quebra com ERR_SSL_PROTOCOL_ERROR até alguém entrar no painel à mão).
-- Servindo por caminho, o site fica sob o certificado do domínio principal,
-- que já funciona, sem depender de wildcard.

alter table public.mini_apps rename column subdomain to site_path;

alter table public.mini_apps
  rename constraint mini_apps_subdomain_format to mini_apps_site_path_format;
alter table public.mini_apps
  rename constraint mini_apps_subdomain_key to mini_apps_site_path_key;
alter table public.mini_apps
  rename constraint mini_apps_subdomain_required_when_hosted_site
  to mini_apps_site_path_required_when_hosted_site;

drop function public.get_hosted_site_by_subdomain(text);

create function public.get_hosted_site_by_path(p_site_path text)
returns table (id uuid, is_active boolean)
language sql
stable
security definer
set search_path = public
as $$
  select ma.id, ma.is_active from public.mini_apps ma
  where ma.site_path = p_site_path and ma.type = 'hosted_site';
$$;

grant execute on function public.get_hosted_site_by_path(text) to anon, authenticated;
