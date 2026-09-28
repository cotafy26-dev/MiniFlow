import "server-only";

import { sendEmail } from "@/core/email/send";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_SUBJECT = "Bem-vindo(a) ao {{tenantName}}!";
const DEFAULT_BODY = `Olá {{fullName}},\n\nSua conta em {{tenantName}} foi criada com sucesso. Estamos felizes em ter você por aqui!`;

export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => vars[key] ?? "");
}

function toHtml(body: string): string {
  return `<p>${body.replace(/\n/g, "<br>")}</p>`;
}

/**
 * Called from /auth/callback on every code exchange except password
 * recovery — Google OAuth hits that route on every login, not just the
 * first, so this must stay idempotent via welcome_email_sent_at rather
 * than assuming "called once" from the caller's path.
 */
export async function sendWelcomeEmailIfNeeded(userId: string): Promise<void> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, default_tenant_id, welcome_email_sent_at")
    .eq("id", userId)
    .maybeSingle();

  if (!profile || profile.welcome_email_sent_at || !profile.default_tenant_id) return;

  const [{ data: settings }, { data: tenant }] = await Promise.all([
    supabase
      .from("tenant_settings")
      .select("welcome_email_subject, welcome_email_body")
      .eq("tenant_id", profile.default_tenant_id)
      .maybeSingle(),
    supabase.from("tenants").select("name").eq("id", profile.default_tenant_id).maybeSingle(),
  ]);

  const vars = { fullName: profile.full_name, tenantName: tenant?.name ?? "MedFlow System" };
  const subject = renderTemplate(settings?.welcome_email_subject || DEFAULT_SUBJECT, vars);
  const body = renderTemplate(settings?.welcome_email_body || DEFAULT_BODY, vars);

  const result = await sendEmail({ to: profile.email, subject, html: toHtml(body) });
  if (!result.error) {
    await supabase
      .from("profiles")
      .update({ welcome_email_sent_at: new Date().toISOString() })
      .eq("id", userId);
  }
}

export { DEFAULT_SUBJECT, DEFAULT_BODY, toHtml };
