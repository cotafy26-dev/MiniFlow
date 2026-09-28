import "server-only";

import { getPublicProfiles } from "@/core/users/queries";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type SupportTicket = Database["public"]["Tables"]["support_tickets"]["Row"];
export type SupportTicketMessage = Database["public"]["Tables"]["support_ticket_messages"]["Row"];

export interface SupportTicketWithMeta extends SupportTicket {
  userName: string;
}

export interface SupportTicketMessageWithMeta extends SupportTicketMessage {
  authorName: string;
  authorAvatarUrl: string | null;
  isStaff: boolean;
}

async function attachTicketMeta(tickets: SupportTicket[]): Promise<SupportTicketWithMeta[]> {
  if (tickets.length === 0) return [];
  const profiles = await getPublicProfiles(tickets.map((t) => t.user_id));
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  return tickets.map((ticket) => ({
    ...ticket,
    userName: profileById.get(ticket.user_id)?.fullName ?? "—",
  }));
}

export async function getTicketsForAdmin(
  tenantId: string,
  { status }: { status?: SupportTicket["status"] } = {}
): Promise<SupportTicketWithMeta[]> {
  const supabase = await createClient();
  let query = supabase
    .from("support_tickets")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("last_message_at", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data } = await query;
  return attachTicketMeta(data ?? []);
}

export async function getMyTickets(tenantId: string, userId: string): Promise<SupportTicketWithMeta[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .order("last_message_at", { ascending: false });
  return attachTicketMeta(data ?? []);
}

export async function getTicketById(id: string): Promise<SupportTicketWithMeta | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("support_tickets").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  const [withMeta] = await attachTicketMeta([data]);
  return withMeta;
}

export async function getTicketMessages(ticketId: string): Promise<SupportTicketMessageWithMeta[]> {
  const supabase = await createClient();
  const [{ data: ticket }, { data: messages }] = await Promise.all([
    supabase.from("support_tickets").select("user_id").eq("id", ticketId).maybeSingle(),
    supabase
      .from("support_ticket_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true }),
  ]);

  if (!messages || messages.length === 0) return [];
  const profiles = await getPublicProfiles(messages.map((m) => m.author_id));
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  return messages.map((message) => ({
    ...message,
    authorName: profileById.get(message.author_id)?.fullName ?? "—",
    authorAvatarUrl: profileById.get(message.author_id)?.avatarUrl ?? null,
    isStaff: ticket ? message.author_id !== ticket.user_id : false,
  }));
}
