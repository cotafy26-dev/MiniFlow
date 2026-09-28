import type { Metadata } from "next";

import { PlanCatalogManager } from "@/components/admin/plan-catalog-manager";
import { TenantPlanUsageCard } from "@/components/admin/tenant-plan-usage-card";
import { getAllPlansForAdmin, getTenantPlanUsage } from "@/core/plans/queries";
import { requireTenantContext } from "@/core/permissions/guards";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.plans.title };

export default async function AdminPlansPage() {
  const ctx = await requireTenantContext();
  const usage = ctx.tenant
    ? await getTenantPlanUsage(ctx.tenant.id)
    : { plan: null, memberCount: 0, miniAppCount: 0, productCount: 0 };
  const plans = ctx.isSuperAdmin ? await getAllPlansForAdmin() : [];

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">{pt.plans.title}</h2>
        <p className="text-sm text-muted-foreground">{pt.plans.subtitle}</p>
      </div>

      <TenantPlanUsageCard usage={usage} />

      {ctx.isSuperAdmin && <PlanCatalogManager plans={plans} currentPlanKey={usage.plan?.key ?? null} />}
    </div>
  );
}
