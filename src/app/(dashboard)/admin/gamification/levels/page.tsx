import type { Metadata } from "next";

import { GamificationLevelsManager } from "@/components/admin/gamification-levels-manager";
import { getGamificationLevels } from "@/core/gamification/queries";
import { requireTenantContext } from "@/core/permissions/guards";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.gamification.levels.title };

export default async function AdminGamificationLevelsPage() {
  const ctx = await requireTenantContext();
  const levels = ctx.tenant ? await getGamificationLevels(ctx.tenant.id) : [];

  return <GamificationLevelsManager levels={levels} />;
}
