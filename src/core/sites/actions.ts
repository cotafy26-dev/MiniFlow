"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { logActivity } from "@/core/activity-log/log";
import { PERMISSIONS } from "@/core/permissions/constants";
import { requirePermission } from "@/core/permissions/guards";
import { createClient } from "@/lib/supabase/server";

export interface SiteActionResult {
  error?: string;
}

function revalidateSiteSurfaces() {
  revalidatePath("/admin/sites");
}

export async function createSiteAction(name: string, subdomain: string): Promise<SiteActionResult> {
  const ctx = await requirePermission(PERMISSIONS.APPS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sites")
    .insert({ tenant_id: ctx.tenant.id, name, subdomain, created_by: ctx.userId })
    .select("id")
    .single();

  if (error) {
    return { error: error.code === "23505" ? "Este subdomínio já está em uso." : error.message };
  }

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "sites.created",
    entityType: "site",
    entityId: data.id,
  });
  revalidateSiteSurfaces();
  redirect(`/admin/sites/${data.id}/content`);
}

export async function updateSiteAction(
  id: string,
  values: { name: string; subdomain: string; isActive: boolean }
): Promise<SiteActionResult> {
  const ctx = await requirePermission(PERMISSIONS.APPS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("sites")
    .update({ name: values.name, subdomain: values.subdomain, is_active: values.isActive })
    .eq("id", id)
    .eq("tenant_id", ctx.tenant.id);

  if (error) {
    return { error: error.code === "23505" ? "Este subdomínio já está em uso." : error.message };
  }

  await logActivity({ tenantId: ctx.tenant.id, action: "sites.updated", entityType: "site", entityId: id });
  revalidateSiteSurfaces();
  redirect("/admin/sites");
}

export async function updateSiteContentAction(id: string, htmlContent: string): Promise<SiteActionResult> {
  const ctx = await requirePermission(PERMISSIONS.APPS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("sites")
    .update({ html_content: htmlContent })
    .eq("id", id)
    .eq("tenant_id", ctx.tenant.id);

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "sites.content_updated",
    entityType: "site",
    entityId: id,
  });
  revalidateSiteSurfaces();
  redirect("/admin/sites");
}

export async function deleteSiteAction(id: string): Promise<SiteActionResult> {
  const ctx = await requirePermission(PERMISSIONS.APPS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase.from("sites").delete().eq("id", id).eq("tenant_id", ctx.tenant.id);
  if (error) return { error: error.message };

  await logActivity({ tenantId: ctx.tenant.id, action: "sites.deleted", entityType: "site", entityId: id });
  revalidateSiteSurfaces();
  return {};
}
