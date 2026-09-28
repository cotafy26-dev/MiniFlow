import "server-only";

import { getPublicProfiles } from "@/core/users/queries";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Community = Database["public"]["Tables"]["communities"]["Row"];
export type CommunityMember = Database["public"]["Tables"]["community_members"]["Row"];

export interface CommunityMemberWithProfile extends CommunityMember {
  fullName: string;
  avatarUrl: string | null;
}

export async function getCommunitiesForAdmin(tenantId: string): Promise<Community[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("communities")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("sort_order");

  return data ?? [];
}

/**
 * Directory read path. RLS already restricts rows, but a Super Admin
 * session sees every tenant's communities through has_permission() — the
 * explicit tenant_id filter is what actually keeps this single-tenant,
 * same rule as getVisibleProducts/getVisibleMiniApps.
 */
export async function getVisibleCommunities(tenantId: string): Promise<Community[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("communities")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("sort_order");

  return data ?? [];
}

export async function getCommunityById(tenantId: string, id: string): Promise<Community | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("communities")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();

  return data;
}

export async function getCommunityBySlug(tenantId: string, slug: string): Promise<Community | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("communities")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("slug", slug)
    .maybeSingle();

  return data;
}

export async function getCommunityMembers(communityId: string): Promise<CommunityMemberWithProfile[]> {
  const supabase = await createClient();
  const { data: members } = await supabase
    .from("community_members")
    .select("*")
    .eq("community_id", communityId)
    .order("joined_at");

  if (!members || members.length === 0) return [];

  const profiles = await getPublicProfiles(members.map((m) => m.user_id));
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  return members.map((member) => {
    const profile = profileById.get(member.user_id);
    return {
      ...member,
      fullName: profile?.fullName ?? "—",
      avatarUrl: profile?.avatarUrl ?? null,
    };
  });
}

export async function getMyMembership(
  communityId: string,
  userId: string
): Promise<CommunityMember | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("community_members")
    .select("*")
    .eq("community_id", communityId)
    .eq("user_id", userId)
    .maybeSingle();

  return data;
}

// ---------------------------------------------------------------------------
// Moderation
// ---------------------------------------------------------------------------

export interface ModerationReportItem {
  id: string;
  targetType: "post" | "comment";
  targetId: string;
  reporterName: string;
  reason: string;
  createdAt: string;
  preview: string;
}

async function getPostPreviews(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const supabase = await createClient();
  const { data } = await supabase.from("posts").select("id, body_text").in("id", ids);
  return new Map((data ?? []).map((p) => [p.id, p.body_text ?? "(sem texto)"]));
}

async function getCommentPreviews(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const supabase = await createClient();
  const { data } = await supabase.from("comments").select("id, body").in("id", ids);
  return new Map((data ?? []).map((c) => [c.id, c.body]));
}

/**
 * One queue covering both Feed and every community — a content_reports row
 * doesn't distinguish the two, and the community.moderate permission
 * already spans both.
 */
export async function getModerationQueue(tenantId: string): Promise<ModerationReportItem[]> {
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from("content_reports")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (!reports || reports.length === 0) return [];

  const postIds = reports.filter((r) => r.target_type === "post").map((r) => r.target_id);
  const commentIds = reports.filter((r) => r.target_type === "comment").map((r) => r.target_id);

  const [postPreviews, commentPreviews, profiles] = await Promise.all([
    getPostPreviews(postIds),
    getCommentPreviews(commentIds),
    getPublicProfiles(reports.map((r) => r.reporter_id)),
  ]);
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  return reports.map((report) => ({
    id: report.id,
    targetType: report.target_type as "post" | "comment",
    targetId: report.target_id,
    reporterName: profileById.get(report.reporter_id)?.fullName ?? "—",
    reason: report.reason,
    createdAt: report.created_at,
    preview:
      report.target_type === "post"
        ? postPreviews.get(report.target_id) ?? "(post removido)"
        : commentPreviews.get(report.target_id) ?? "(comentário removido)",
  }));
}
