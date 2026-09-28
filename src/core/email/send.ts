import "server-only";

import { Resend } from "resend";

export interface SendEmailResult {
  error?: string;
}

const EMAIL_FROM = process.env.EMAIL_FROM ?? "MiniFlow <onboarding@resend.dev>";

/**
 * Lazily instantiated so a missing RESEND_API_KEY never crashes module
 * load (import chains that reach this file run in every request, not
 * just the auth callback) — it just makes every send() report an error.
 */
function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  return apiKey ? new Resend(apiKey) : null;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendEmailResult> {
  const client = getClient();
  if (!client) return { error: "RESEND_API_KEY não configurada — e-mail não enviado." };

  const { error } = await client.emails.send({ from: EMAIL_FROM, to, subject, html });
  if (error) return { error: error.message };
  return {};
}
