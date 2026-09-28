import type { Metadata } from "next";

import { PlanForm } from "@/components/admin/plan-form";
import { requireSuperAdmin } from "@/core/permissions/guards";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.plans.newPlan };

export default async function NewPlanPage() {
  await requireSuperAdmin();

  return (
    <div className="flex max-w-lg flex-col gap-5">
      <h2 className="text-lg font-semibold">{pt.plans.newPlan}</h2>
      <PlanForm mode="create" />
    </div>
  );
}
