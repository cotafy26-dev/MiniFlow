"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { changeTenantPlanAction } from "@/core/plans/actions";
import type { Plan } from "@/core/plans/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";

export function PlanCatalogManager({ plans, currentPlanKey }: { plans: Plan[]; currentPlanKey: string | null }) {
  const router = useRouter();

  async function handleChangePlan(key: string) {
    if (!window.confirm(pt.plans.changePlanConfirm)) return;
    const result = await changeTenantPlanAction(key);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{pt.plans.catalogTitle}</h3>
        <Button size="sm" render={<Link href="/admin/plans/new" />}>
          <Plus className="size-4" />
          {pt.plans.newPlan}
        </Button>
      </div>

      <div className="flex flex-col divide-y rounded-xl border">
        {plans.map((plan) => (
          <div key={plan.key} className="flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">{plan.name}</p>
                {plan.key === currentPlanKey && <Badge variant="outline">{pt.plans.currentPlan}</Badge>}
                <Badge variant={plan.is_active ? "default" : "outline"}>
                  {plan.is_active ? pt.plans.active : pt.plans.inactive}
                </Badge>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {plan.max_mini_apps ?? "∞"} mini-apps · {plan.max_products ?? "∞"} produtos ·{" "}
                {plan.max_members ?? "∞"} membros
              </p>
            </div>

            {plan.key !== currentPlanKey && (
              <Button type="button" variant="outline" size="sm" onClick={() => handleChangePlan(plan.key)}>
                {pt.plans.changePlanTo}
              </Button>
            )}
            <Button variant="ghost" size="icon-sm" render={<Link href={`/admin/plans/${plan.key}/edit`} />}>
              <Pencil className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
