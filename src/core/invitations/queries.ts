import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Invitation = Database["public"]["Tables"]["invitations"]["Row"];

export interface PendingInvitation extends Invitation {
  roleName: string;
}

export async function getPendingInvitations(tenantId: string): Promise<PendingInvitation[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invitations")
    .select("*, roles(name)")
    .eq("tenant_id", tenantId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => {
    const { roles, ...invitation } = row as Invitation & { roles: { name: string } | null };
    return { ...invitation, roleName: roles?.name ?? "—" };
  });
}

export interface InvitationSummary {
  tenantName: string;
  email: string;
  roleName: string;
  status: Invitation["status"];
  expiresAt: string;
}

/**
 * Public lookup — the invitee has no session yet, so this goes through
 * get_invitation_by_token() (SECURITY DEFINER, granted to anon) rather
 * than a direct table query, same pattern as certificate verification.
 */
export async function getInvitationByToken(token: string): Promise<InvitationSummary | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_invitation_by_token", { p_token: token }).maybeSingle();
  if (!data) return null;

  return {
    tenantName: data.tenant_name,
    email: data.email,
    roleName: data.role_name,
    status: data.status as Invitation["status"],
    expiresAt: data.expires_at,
  };
}
