import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type ProductCategory = Database["public"]["Tables"]["product_categories"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ModuleRow = Database["public"]["Tables"]["modules"]["Row"];
export type Lesson = Database["public"]["Tables"]["lessons"]["Row"];

export interface ProductWithRelations extends Product {
  categoryName: string | null;
}

export interface ModuleWithLessons extends ModuleRow {
  lessons: Lesson[];
}

export interface ProductProgress {
  totalLessons: number;
  completedLessons: number;
  percent: number;
  moduleProgress: { moduleId: string; total: number; completed: number }[];
}

export interface LessonNav {
  id: string;
  name: string;
}

export interface ProductAccessGrant {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  grantedAt: string;
}

export async function getProductCategories(tenantId: string): Promise<ProductCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_categories")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("sort_order");

  return data ?? [];
}

export async function getProductsForAdmin(tenantId: string): Promise<ProductWithRelations[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, category:product_categories(name)")
    .eq("tenant_id", tenantId)
    .order("sort_order");

  return (data ?? []).map((row) => {
    const { category, ...product } = row as Product & { category: { name: string } | null };
    return { ...product, categoryName: category?.name ?? null };
  });
}

export async function getProductById(
  tenantId: string,
  id: string
): Promise<ProductWithRelations | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, category:product_categories(name)")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  const { category, ...product } = data as Product & { category: { name: string } | null };
  return { ...product, categoryName: category?.name ?? null };
}

/**
 * Catalog read path. RLS already restricts rows to what can_view_product()
 * allows, but a Super Admin session sees every tenant's products through
 * that function — the explicit tenant_id filter below is what actually
 * keeps this single-tenant, not RLS alone (same rule as mini-apps).
 */
export async function getVisibleProducts(tenantId: string): Promise<Product[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("sort_order");

  return data ?? [];
}

export async function getProductBySlug(tenantId: string, slug: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("slug", slug)
    .maybeSingle();

  return data;
}

async function getModulesWithLessons(
  tenantId: string,
  productId: string,
  onlyPublishedLessons: boolean
): Promise<ModuleWithLessons[]> {
  const supabase = await createClient();

  const [{ data: modules }, { data: lessons }] = await Promise.all([
    supabase
      .from("modules")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("product_id", productId)
      .order("sort_order"),
    (() => {
      let query = supabase
        .from("lessons")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("product_id", productId);
      if (onlyPublishedLessons) query = query.eq("status", "published");
      return query.order("sort_order");
    })(),
  ]);

  return (modules ?? []).map((module) => ({
    ...module,
    lessons: (lessons ?? []).filter((lesson) => lesson.module_id === module.id),
  }));
}

export function getModulesWithLessonsForAdmin(tenantId: string, productId: string) {
  return getModulesWithLessons(tenantId, productId, false);
}

export function getModulesWithLessonsForMember(tenantId: string, productId: string) {
  return getModulesWithLessons(tenantId, productId, true);
}

export async function getLessonById(tenantId: string, id: string): Promise<Lesson | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lessons")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();

  return data;
}

export async function getLessonForViewer(
  tenantId: string,
  lessonId: string
): Promise<Lesson | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lessons")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", lessonId)
    .eq("status", "published")
    .maybeSingle();

  return data;
}

export async function getProductProgress(
  tenantId: string,
  productId: string,
  userId: string
): Promise<ProductProgress> {
  const supabase = await createClient();

  const [{ data: lessons }, { data: progress }] = await Promise.all([
    supabase
      .from("lessons")
      .select("id, module_id")
      .eq("tenant_id", tenantId)
      .eq("product_id", productId)
      .eq("status", "published"),
    supabase
      .from("lesson_progress")
      .select("lesson_id, module_id")
      .eq("tenant_id", tenantId)
      .eq("product_id", productId)
      .eq("user_id", userId),
  ]);

  const completedLessonIds = new Set((progress ?? []).map((p) => p.lesson_id));
  const byModule = new Map<string, { total: number; completed: number }>();

  for (const lesson of lessons ?? []) {
    const entry = byModule.get(lesson.module_id) ?? { total: 0, completed: 0 };
    entry.total += 1;
    if (completedLessonIds.has(lesson.id)) entry.completed += 1;
    byModule.set(lesson.module_id, entry);
  }

  const totalLessons = lessons?.length ?? 0;
  const completedLessons = completedLessonIds.size;

  return {
    totalLessons,
    completedLessons,
    percent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
    moduleProgress: Array.from(byModule.entries()).map(([moduleId, v]) => ({
      moduleId,
      ...v,
    })),
  };
}

export async function getAdjacentLessons(
  tenantId: string,
  productId: string,
  lessonId: string
): Promise<{ previous: LessonNav | null; next: LessonNav | null }> {
  const supabase = await createClient();

  const [{ data: modules }, { data: lessons }] = await Promise.all([
    supabase
      .from("modules")
      .select("id, sort_order")
      .eq("tenant_id", tenantId)
      .eq("product_id", productId)
      .order("sort_order"),
    supabase
      .from("lessons")
      .select("id, name, module_id, sort_order")
      .eq("tenant_id", tenantId)
      .eq("product_id", productId)
      .eq("status", "published"),
  ]);

  const moduleOrder = new Map((modules ?? []).map((m, i) => [m.id, i]));
  const ordered = [...(lessons ?? [])].sort((a, b) => {
    const moduleDiff = (moduleOrder.get(a.module_id) ?? 0) - (moduleOrder.get(b.module_id) ?? 0);
    if (moduleDiff !== 0) return moduleDiff;
    return a.sort_order - b.sort_order;
  });

  const index = ordered.findIndex((l) => l.id === lessonId);
  if (index === -1) return { previous: null, next: null };

  const previous = index > 0 ? ordered[index - 1] : null;
  const next = index < ordered.length - 1 ? ordered[index + 1] : null;

  return {
    previous: previous ? { id: previous.id, name: previous.name } : null,
    next: next ? { id: next.id, name: next.name } : null,
  };
}

export async function getProductAccessGrants(
  tenantId: string,
  productId: string
): Promise<ProductAccessGrant[]> {
  const supabase = await createClient();
  const { data: grants } = await supabase
    .from("product_access")
    .select("id, user_id, granted_at")
    .eq("tenant_id", tenantId)
    .eq("product_id", productId)
    .order("granted_at", { ascending: false });

  if (!grants || grants.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in(
      "id",
      grants.map((g) => g.user_id)
    );

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return grants.map((grant) => {
    const profile = profileById.get(grant.user_id);
    return {
      id: grant.id,
      userId: grant.user_id,
      fullName: profile?.full_name ?? "—",
      email: profile?.email ?? "—",
      grantedAt: grant.granted_at,
    };
  });
}
