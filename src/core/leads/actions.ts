"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/core/email/send";
import type { LeadValues } from "@/lib/validations/leads";

export interface LeadActionResult {
  error?: string;
}

/**
 * Public, unauthenticated: reached from /planos by a visitor with no
 * account. Always runs through the service-role client — there is no
 * tenant context here to scope an RLS-respecting insert to.
 */
export async function createLeadAction(values: LeadValues): Promise<LeadActionResult> {
  const admin = createAdminClient();
  const { error } = await admin.from("platform_leads").insert({
    name: values.name,
    email: values.email,
    whatsapp: values.whatsapp,
    message: values.message || null,
  });

  if (error) return { error: "Não foi possível enviar. Tente novamente em instantes." };

  const emailResult = await sendEmail({
    to: "netcellinfo@gmail.com",
    subject: `Novo interessado no MedFlow System: ${values.name}`,
    html: `
      <p><strong>${values.name}</strong> quer assinar o MedFlow System (R$ 397,97/ano).</p>
      <p>E-mail: ${values.email}</p>
      <p>WhatsApp: ${values.whatsapp}</p>
      ${values.message ? `<p>Mensagem: ${values.message}</p>` : ""}
    `,
  });
  if (emailResult.error) console.error("Failed to send lead notification email:", emailResult.error);

  return {};
}
