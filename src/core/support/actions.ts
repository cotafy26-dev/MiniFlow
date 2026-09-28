"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/core/activity-log/log";
import { requireTenantContext } from "@/core/permissions/guards";
import { sendPushToUser } from "@/core/push/send";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export interface SupportActionResult {
  error?: string;
  ticketId?: string;
}

export async function createTicketAction(subject: string, body: string): Promise<SupportActionResult> {
  const ctx = await requireTenantContext();
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({ tenant_id: ctx.tenant.id, user_id: ctx.userId, subject })
    .select("id")
    .single();

  if (error) return { error: "Não foi possível abrir o chamado." };

  const { error: messageError } = await supabase.from("support_ticket_messages").insert({
    tenant_id: ctx.tenant.id,
    ticket_id: ticket.id,
    author_id: ctx.userId,
    body,
  });
  if (messageError) return { error: "Não foi possível abrir o chamado." };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "support.ticket_created",
    entityType: "support_ticket",
    entityId: ticket.id,
  });
  revalidatePath("/support");
  revalidatePath("/admin/support");
  return { ticketId: ticket.id };
}

export async function replyToTicketAction(ticketId: string, body: string): Promise<SupportActionResult> {
  const ctx = await requireTenantContext();
  const supabase = await createClient();

  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("tenant_id, user_id, subject")
    .eq("id", ticketId)
    .maybeSingle();
  if (!ticket) return { error: "Chamado não encontrado." };

  const { error } = await supabase.from("support_ticket_messages").insert({
    tenant_id: ticket.tenant_id,
    ticket_id: ticketId,
    author_id: ctx.userId,
    body,
  });
  // RLS is the real gate (can_view_ticket) — a denial surfaces here as a
  // plain Postgres error, same discipline as createPostAction.
  if (error) return { error: "Não foi possível enviar a resposta." };

  await supabase
    .from("support_tickets")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", ticketId);

  // Only notify the member when STAFF replies — not the other direction
  // (notifying every support.manage holder would be a much bigger
  // fan-out, deferred). Never let a push failure break the reply itself.
  if (ctx.userId !== ticket.user_id) {
    try {
      await sendPushToUser(ticket.user_id, {
        title: `Nova resposta: ${ticket.subject}`,
        body: body.slice(0, 140),
        url: `/support/${ticketId}`,
      });
    } catch (pushError) {
      console.error("sendPushToUser failed", pushError);
    }
  }

  revalidatePath(`/support/${ticketId}`);
  revalidatePath(`/admin/support/${ticketId}`);
  revalidatePath("/support");
  revalidatePath("/admin/support");
  return {};
}

export async function updateTicketStatusAction(
  ticketId: string,
  status: Database["public"]["Tables"]["support_tickets"]["Row"]["status"]
): Promise<SupportActionResult> {
  await requireTenantContext();
  const supabase = await createClient();

  const { error } = await supabase.from("support_tickets").update({ status }).eq("id", ticketId);
  if (error) return { error: "Não foi possível atualizar o status do chamado." };

  revalidatePath(`/support/${ticketId}`);
  revalidatePath(`/admin/support/${ticketId}`);
  revalidatePath("/support");
  revalidatePath("/admin/support");
  return {};
}
