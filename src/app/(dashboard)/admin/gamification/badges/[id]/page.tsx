import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BadgeMemberManager, type BadgeMemberAward } from "@/components/admin/badge-member-manager";
import { getBadgeAwards, getBadgesForAdmin } from "@/core/gamification/queries";
import { requireTenantContext } from "@/core/permissions/guards";
import { getTenantMembersForAdmin } from "@/core/users/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: id };
}

export default async function AdminBadgeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireTenantContext();
  if (!ctx.tenant) notFound();

  const [badges, awards, members] = await Promise.all([
    getBadgesForAdmin(ctx.tenant.id),
    getBadgeAwards(id),
    getTenantMembersForAdmin(ctx.tenant.id),
  ]);

  const badge = badges.find((b) => b.id === id);
  if (!badge) notFound();

  const memberById = new Map(members.map((m) => [m.userId, m]));
  const enrichedAwards: BadgeMemberAward[] = awards.map((award) => {
    const member = memberById.get(award.userId);
    return {
      userId: award.userId,
      fullName: member?.fullName ?? "—",
      email: member?.email ?? "—",
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-lg">
          {badge.icon || "🏆"}
        </span>
        <h2 className="text-lg font-semibold">{badge.name}</h2>
      </div>

      <BadgeMemberManager badgeId={badge.id} awards={enrichedAwards} members={members} />
    </div>
  );
}
