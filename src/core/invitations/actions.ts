"use server";

import { randomBytes } from "node:crypto";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { logActivity } from "@/core/activity-log/log";
import { PERMISSIONS } from "@/core/permissions/constants";
import { requirePermission } from "@/core/permissions/guards";
import { sendEmail } from "@/core/email/send";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export interface InvitationActionResult {
  error?: string;
}

export async function createInvitationAction(
  email: string,
  roleId: string
): Promise<InvitationActionResult> {
  const ctx = await requirePermission(PERMISSIONS.MEMBERS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();

  const { data: hasAccount } = await supabase.rpc("email_has_account", { p_email: email });
  if (hasAccount) {
    return {
      error:
        "Este e-mail já possui uma conta no MiniFlow. Suporte a múltiplos espaços por conta ainda não está disponível.",
    };
  }

  const token = randomBytes(32).toString("hex");

  const { data: existing } = await supabase
    .from("invitations")
    .select("id")
    .eq("tenant_id", ctx.tenant.id)
    .eq("email", email)
    .eq("status", "pending")
    .maybeSingle();

  const { error } = existing
    ? await supabase
        .from("invitations")
        .update({ role_id: roleId, token, expires_at: new Date(Date.now() + 7 * 86400000).toISOString() })
        .eq("id", existing.id)
    : await supabase.from("invitations").insert({
        tenant_id: ctx.tenant.id,
        email,
        role_id: roleId,
        token,
        invited_by: ctx.userId,
      });

  if (error) return { error: error.message };

  // The invitation itself is already created and usable (the admin can
  // share inviteUrl manually) — never let a transient email failure
  // block that, same discipline as sendWelcomeEmailIfNeeded/push sends.
  const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/invite/${token}`;
  const emailResult = await sendEmail({
    to: email,
    subject: `Você foi convidado para ${ctx.tenant.name}`,
    html: `<p>${ctx.profile.full_name} convidou você para participar de <strong>${ctx.tenant.name}</strong> no MiniFlow.</p><p><a href="${inviteUrl}">Clique aqui para aceitar o convite</a></p><p>Este link expira em 7 dias.</p>`,
  });
  if (emailResult.error) console.error("Failed to send invitation email:", emailResult.error);

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "invitations.created",
    entityType: "invitation",
    metadata: { email },
  });
  revalidatePath("/admin/members");
  return {};
}

export async function revokeInvitationAction(id: string): Promise<InvitationActionResult> {
  const ctx = await requirePermission(PERMISSIONS.MEMBERS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("invitations")
    .update({ status: "revoked" })
    .eq("id", id)
    .eq("tenant_id", ctx.tenant.id);

  if (error) return { error: error.message };

  revalidatePath("/admin/members");
  return {};
}

export async function acceptInvitationAction(
  token: string,
  fullName: string,
  password: string
): Promise<InvitationActionResult> {
  const supabase = await createClient();

  const { data: invitation } = await supabase
    .rpc("get_invitation_by_token", { p_token: token })
    .maybeSingle();

  if (!invitation) return { error: "Convite não encontrado." };
  if (invitation.status !== "pending") return { error: "Este convite não está mais disponível." };
  if (new Date(invitation.expires_at) < new Date()) return { error: "Este convite expirou." };

  const admin = createAdminClient();
  const { error: createError } = await admin.auth.admin.createUser({
    email: invitation.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, invitation_token: token },
  });

  if (createError) {
    // handle_new_user() runs in the same transaction as this insert — a
    // trigger failure (e.g. the plan's member limit) rolls the whole
    // thing back, so there is no orphaned auth user to clean up here.
    // Surface a friendly message instead of the raw Postgres error.
    return { error: "Não foi possível aceitar o convite. Peça ao administrador para verificar o limite de membros do plano." };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: invitation.email,
    password,
  });
  if (signInError) return { error: "Conta criada, mas não foi possível entrar automaticamente. Faça login." };

  const { data: fullInvitation } = await admin
    .from("invitations")
    .select("tenant_id")
    .eq("token", token)
    .single();
  await logActivity({
    tenantId: fullInvitation?.tenant_id ?? null,
    action: "invitations.accepted",
    entityType: "invitation",
  });
  redirect("/dashboard");
}
