import "server-only";

import { getPublicProfiles } from "@/core/users/queries";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type GamificationLevel = Database["public"]["Tables"]["gamification_levels"]["Row"];
export type Badge = Database["public"]["Tables"]["badges"]["Row"];
export type UserBadge = Database["public"]["Tables"]["user_badges"]["Row"];
export type Certificate = Database["public"]["Tables"]["certificates"]["Row"];

export async function getGamificationLevels(tenantId: string): Promise<GamificationLevel[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("gamification_levels")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("sort_order");
  return data ?? [];
}

export async function getBadgesForAdmin(tenantId: string): Promise<Badge[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("badges")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("sort_order");
  return data ?? [];
}

export async function getVisibleBadges(tenantId: string): Promise<Badge[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("badges")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("sort_order");
  return data ?? [];
}

export interface BadgeAward {
  id: string;
  badgeId: string;
  userId: string;
  awardedAt: string;
}

export async function getUserBadges(userId: string): Promise<(UserBadge & { badge: Badge })[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_badges")
    .select("*, badges(*)")
    .eq("user_id", userId);

  return (data ?? []).map((row) => {
    const { badges, ...userBadge } = row as UserBadge & { badges: Badge };
    return { ...userBadge, badge: badges };
  });
}

export async function getBadgeAwards(badgeId: string): Promise<BadgeAward[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_badges")
    .select("id, badge_id, user_id, awarded_at")
    .eq("badge_id", badgeId);

  return (data ?? []).map((row) => ({
    id: row.id,
    badgeId: row.badge_id,
    userId: row.user_id,
    awardedAt: row.awarded_at,
  }));
}

/** Pure — no I/O. The highest level whose min_points the total already clears. */
export function getCurrentLevel(
  levels: GamificationLevel[],
  totalPoints: number
): GamificationLevel | null {
  const eligible = levels.filter((level) => level.min_points <= totalPoints);
  if (eligible.length === 0) return null;
  return eligible.reduce((highest, level) => (level.min_points > highest.min_points ? level : highest));
}

export async function getMyTotalPoints(tenantId: string, userId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("gamification_points")
    .select("points")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId);
  return (data ?? []).reduce((sum, row) => sum + row.points, 0);
}

export interface RankingEntry {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  totalPoints: number;
}

export async function getRanking(tenantId: string, { limit = 20 }: { limit?: number } = {}): Promise<RankingEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("gamification_points")
    .select("user_id, points")
    .eq("tenant_id", tenantId);

  const totals = new Map<string, number>();
  for (const row of data ?? []) {
    totals.set(row.user_id, (totals.get(row.user_id) ?? 0) + row.points);
  }

  const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
  const profiles = await getPublicProfiles(sorted.map(([userId]) => userId));
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  return sorted.map(([userId, totalPoints]) => {
    const profile = profileById.get(userId);
    return {
      userId,
      fullName: profile?.fullName ?? "—",
      avatarUrl: profile?.avatarUrl ?? null,
      totalPoints,
    };
  });
}

export async function getCertificatesForUser(tenantId: string, userId: string): Promise<Certificate[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("certificates")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .order("issued_at", { ascending: false });
  return data ?? [];
}

export interface CertificateVerification {
  studentName: string;
  productName: string;
  tenantName: string;
  issuedAt: string;
}

/**
 * Public, unauthenticated lookup — backs /certificate/[code]. Calls the
 * verify_certificate() RPC (0036), the only function in the schema granted
 * to the `anon` role.
 */
export async function verifyCertificate(certificateNumber: string): Promise<CertificateVerification | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .rpc("verify_certificate", { p_certificate_number: certificateNumber })
    .maybeSingle();

  if (!data) return null;
  return {
    studentName: data.student_name,
    productName: data.product_name,
    tenantName: data.tenant_name,
    issuedAt: data.issued_at,
  };
}
