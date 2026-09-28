import type { Metadata } from "next";

import { BadgesManager } from "@/components/admin/badges-manager";
import { getBadgesForAdmin } from "@/core/gamification/queries";
import { requireTenantContext } from "@/core/permissions/guards";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.gamification.badges.title };

export default async function AdminBadgesPage() {
  const ctx = await requireTenantContext();
  const badges = ctx.tenant ? await getBadgesForAdmin(ctx.tenant.id) : [];

  return <BadgesManager badges={badges} />;
}
