import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PlanForm } from "@/components/admin/plan-form";
import { getPlanByKey } from "@/core/plans/queries";
import { requireSuperAdmin } from "@/core/permissions/guards";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ key: string }>;
}): Promise<Metadata> {
  const { key } = await params;
  return { title: key };
}

export default async function EditPlanPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  await requireSuperAdmin();

  const plan = await getPlanByKey(key);
  if (!plan) notFound();

  return (
    <div className="flex max-w-lg flex-col gap-5">
      <h2 className="text-lg font-semibold">{plan.name}</h2>
      <PlanForm
        mode="edit"
        planKey={plan.key}
        defaultValues={{
          key: plan.key,
          name: plan.name,
          maxMembers: plan.max_members,
          maxMiniApps: plan.max_mini_apps,
          maxProducts: plan.max_products,
          price: (plan.price_cents ?? 0) / 100,
          sortOrder: plan.sort_order,
          isActive: plan.is_active,
        }}
      />
    </div>
  );
}
