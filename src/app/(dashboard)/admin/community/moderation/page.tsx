import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ModerationQueue } from "@/components/admin/moderation-queue";
import { getModerationQueue } from "@/core/communities/queries";
import { PERMISSIONS } from "@/core/permissions/constants";
import { requireTenantContext } from "@/core/permissions/guards";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.community.moderation.title };

export default async function CommunityModerationPage() {
  const ctx = await requireTenantContext();
  // The parent layout's OR-guard also admits a community.manage-only
  // visitor (who can create communities but has no business resolving
  // reports) — this page needs community.moderate specifically.
  if (!ctx.isSuperAdmin && !ctx.permissions.has(PERMISSIONS.COMMUNITY_MODERATE)) {
    redirect("/admin/community");
  }

  const reports = ctx.tenant ? await getModerationQueue(ctx.tenant.id) : [];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold">{pt.community.moderation.title}</h2>
        <p className="text-sm text-muted-foreground">{pt.community.moderation.subtitle}</p>
      </div>

      <ModerationQueue reports={reports} />
    </div>
  );
}
