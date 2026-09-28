"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/core/activity-log/log";
import { DEFAULT_BODY, DEFAULT_SUBJECT, renderTemplate, toHtml } from "@/core/email/welcome";
import { sendEmail } from "@/core/email/send";
import { PERMISSIONS } from "@/core/permissions/constants";
import { requirePermission } from "@/core/permissions/guards";
import { createClient } from "@/lib/supabase/server";
import type { EmailSettingsValues } from "@/lib/validations/email";

export interface EmailActionResult {
  error?: string;
}

export async function updateEmailSettingsAction(values: EmailSettingsValues): Promise<EmailActionResult> {
  const ctx = await requirePermission(PERMISSIONS.TENANT_SETTINGS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tenant_settings")
    .update({
      welcome_email_subject: values.subject || null,
      welcome_email_body: values.body || null,
    })
    .eq("tenant_id", ctx.tenant.id);

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "email_settings.updated",
    entityType: "tenant_settings",
  });
  revalidatePath("/admin/emails");
  return {};
}

export async function sendTestWelcomeEmailAction(values: EmailSettingsValues): Promise<EmailActionResult> {
  const ctx = await requirePermission(PERMISSIONS.TENANT_SETTINGS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const vars = { fullName: ctx.profile.full_name, tenantName: ctx.tenant.name };
  const subject = renderTemplate(values.subject || DEFAULT_SUBJECT, vars);
  const body = renderTemplate(values.body || DEFAULT_BODY, vars);

  return sendEmail({ to: ctx.profile.email, subject, html: toHtml(body) });
}
