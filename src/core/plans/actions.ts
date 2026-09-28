"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { logActivity } from "@/core/activity-log/log";
import { requireSuperAdmin } from "@/core/permissions/guards";
import { createClient } from "@/lib/supabase/server";
import type { PlanValues } from "@/lib/validations/plans";

export interface PlanActionResult {
  error?: string;
}

function revalidatePlanSurfaces() {
  revalidatePath("/admin/plans");
}

export async function createPlanAction(values: PlanValues): Promise<PlanActionResult> {
  await requireSuperAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from("plans").insert({
    key: values.key,
    name: values.name,
    max_members: values.maxMembers,
    max_mini_apps: values.maxMiniApps,
    max_products: values.maxProducts,
    price_cents: Math.round(values.price * 100),
    sort_order: values.sortOrder,
    is_active: values.isActive,
  });

  if (error) return { error: error.message };

  await logActivity({ tenantId: null, action: "plans.created", entityType: "plan", entityId: values.key });
  revalidatePlanSurfaces();
  redirect("/admin/plans");
}

export async function updatePlanAction(key: string, values: PlanValues): Promise<PlanActionResult> {
  await requireSuperAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("plans")
    .update({
      name: values.name,
      max_members: values.maxMembers,
      max_mini_apps: values.maxMiniApps,
      max_products: values.maxProducts,
      price_cents: Math.round(values.price * 100),
      sort_order: values.sortOrder,
      is_active: values.isActive,
    })
    .eq("key", key);

  if (error) return { error: error.message };

  await logActivity({ tenantId: null, action: "plans.updated", entityType: "plan", entityId: key });
  revalidatePlanSurfaces();
  redirect("/admin/plans");
}

export async function changeTenantPlanAction(planKey: string): Promise<PlanActionResult> {
  const ctx = await requireSuperAdmin();
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tenants")
    .update({ plan_key: planKey })
    .eq("id", ctx.tenant.id);

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "tenants.plan_changed",
    entityType: "tenant",
    entityId: ctx.tenant.id,
    metadata: { planKey },
  });
  revalidatePlanSurfaces();
  return {};
}
