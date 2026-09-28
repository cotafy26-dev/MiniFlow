import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type MiniAppCategory = Database["public"]["Tables"]["mini_app_categories"]["Row"];
export type MiniApp = Database["public"]["Tables"]["mini_apps"]["Row"];
export type MiniAppFile = Database["public"]["Tables"]["mini_app_files"]["Row"];

export interface MiniAppWithRelations extends MiniApp {
  categoryName: string | null;
  visibleRoleIds: string[];
}

export async function getMiniAppCategories(tenantId: string): Promise<MiniAppCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mini_app_categories")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("sort_order");

  return data ?? [];
}

export async function getMiniAppsForAdmin(tenantId: string): Promise<MiniAppWithRelations[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mini_apps")
    .select("*, category:mini_app_categories(name), mini_app_visible_roles(role_id)")
    .eq("tenant_id", tenantId)
    .order("sort_order");

  return (data ?? []).map(mapMiniAppRow);
}

export async function getMiniAppById(
  tenantId: string,
  id: string
): Promise<MiniAppWithRelations | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mini_apps")
    .select("*, category:mini_app_categories(name), mini_app_visible_roles(role_id)")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();

  return data ? mapMiniAppRow(data) : null;
}

/**
 * The catalog read path. RLS already restricts rows to what
 * can_view_mini_app() allows, but a Super Admin session sees every
 * tenant's apps through that function — the explicit tenant_id filter
 * below is what actually keeps this single-tenant, not RLS alone.
 */
export async function getVisibleMiniApps(tenantId: string): Promise<MiniApp[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mini_apps")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("sort_order");

  return data ?? [];
}

export async function getMiniAppBySlug(tenantId: string, slug: string): Promise<MiniApp | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mini_apps")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("slug", slug)
    .maybeSingle();

  return data;
}

export async function getMiniAppFiles(tenantId: string, miniAppId: string): Promise<MiniAppFile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mini_app_files")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("mini_app_id", miniAppId)
    .order("path");

  return data ?? [];
}

export async function getFeaturedMiniApps(tenantId: string, limit = 6): Promise<MiniApp[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mini_apps")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("is_featured", { ascending: false })
    .order("sort_order")
    .limit(limit);

  return data ?? [];
}

type RawMiniAppRow = MiniApp & {
  category: { name: string } | null;
  mini_app_visible_roles: { role_id: string }[] | null;
};

function mapMiniAppRow(row: unknown): MiniAppWithRelations {
  const raw = row as RawMiniAppRow;
  const { category, mini_app_visible_roles, ...app } = raw;
  return {
    ...app,
    categoryName: category?.name ?? null,
    visibleRoleIds: (mini_app_visible_roles ?? []).map((r) => r.role_id),
  };
}
