"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { logActivity } from "@/core/activity-log/log";
import { PERMISSIONS } from "@/core/permissions/constants";
import { requirePermission } from "@/core/permissions/guards";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { MiniAppCategoryValues, MiniAppValues } from "@/lib/validations/mini-apps";

export interface MiniAppActionResult {
  error?: string;
}

const MAX_FILES = 100;
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB — matches the bucket's own file_size_limit
const MAX_TOTAL_BYTES = 30 * 1024 * 1024; // 30 MB

const MIME_BY_EXTENSION: Record<string, string> = {
  html: "text/html",
  htm: "text/html",
  css: "text/css",
  js: "text/javascript",
  mjs: "text/javascript",
  json: "application/json",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  ico: "image/x-icon",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
  txt: "text/plain",
  xml: "application/xml",
  map: "application/json",
  webmanifest: "application/manifest+json",
};

function guessContentType(path: string, fallback: string): string {
  if (fallback) return fallback;
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXTENSION[ext] ?? "application/octet-stream";
}

function revalidateAppsSurfaces() {
  revalidatePath("/admin/apps");
  revalidatePath("/apps");
  revalidatePath("/dashboard");
}

export async function createMiniAppCategoryAction(
  values: MiniAppCategoryValues
): Promise<MiniAppActionResult> {
  const ctx = await requirePermission(PERMISSIONS.APPS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mini_app_categories")
    .insert({
      tenant_id: ctx.tenant.id,
      name: values.name,
      slug: values.slug,
      icon: values.icon || null,
      sort_order: values.sortOrder,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "mini_app_categories.created",
    entityType: "mini_app_category",
    entityId: data.id,
  });
  revalidateAppsSurfaces();
  return {};
}

export async function updateMiniAppCategoryAction(
  id: string,
  values: MiniAppCategoryValues
): Promise<MiniAppActionResult> {
  const ctx = await requirePermission(PERMISSIONS.APPS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("mini_app_categories")
    .update({
      name: values.name,
      slug: values.slug,
      icon: values.icon || null,
      sort_order: values.sortOrder,
    })
    .eq("id", id)
    .eq("tenant_id", ctx.tenant.id);

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "mini_app_categories.updated",
    entityType: "mini_app_category",
    entityId: id,
  });
  revalidateAppsSurfaces();
  return {};
}

export async function deleteMiniAppCategoryAction(id: string): Promise<MiniAppActionResult> {
  const ctx = await requirePermission(PERMISSIONS.APPS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("mini_app_categories")
    .delete()
    .eq("id", id)
    .eq("tenant_id", ctx.tenant.id);

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "mini_app_categories.deleted",
    entityType: "mini_app_category",
    entityId: id,
  });
  revalidateAppsSurfaces();
  return {};
}

async function syncVisibleRoles(miniAppId: string, roleIds: string[]) {
  const supabase = await createClient();
  await supabase.from("mini_app_visible_roles").delete().eq("mini_app_id", miniAppId);
  if (roleIds.length > 0) {
    await supabase
      .from("mini_app_visible_roles")
      .insert(roleIds.map((roleId) => ({ mini_app_id: miniAppId, role_id: roleId })));
  }
}

export async function createMiniAppAction(values: MiniAppValues): Promise<MiniAppActionResult> {
  const ctx = await requirePermission(PERMISSIONS.APPS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mini_apps")
    .insert({
      tenant_id: ctx.tenant.id,
      category_id: values.categoryId || null,
      name: values.name,
      slug: values.slug,
      description: values.description || null,
      icon: values.icon || null,
      image_url: values.imageUrl || null,
      url: values.url || null,
      content_html: values.contentHtml || null,
      ai_system_prompt: values.aiSystemPrompt || null,
      subdomain: values.subdomain || null,
      type: values.type,
      status: values.status,
      is_active: values.isActive,
      is_featured: values.isFeatured,
      sort_order: values.sortOrder,
      required_plan: values.requiredPlan,
      created_by: ctx.userId,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.code === "23505" ? "Este subdomínio já está em uso." : error.message };
  }

  await syncVisibleRoles(data.id, values.visibleToRoleIds);
  await logActivity({
    tenantId: ctx.tenant.id,
    action: "mini_apps.created",
    entityType: "mini_app",
    entityId: data.id,
  });
  revalidateAppsSurfaces();
  redirect(values.type === "hosted_site" ? `/admin/apps/${data.id}/files` : "/admin/apps");
}

export async function updateMiniAppAction(
  id: string,
  values: MiniAppValues
): Promise<MiniAppActionResult> {
  const ctx = await requirePermission(PERMISSIONS.APPS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("mini_apps")
    .update({
      category_id: values.categoryId || null,
      name: values.name,
      slug: values.slug,
      description: values.description || null,
      icon: values.icon || null,
      image_url: values.imageUrl || null,
      url: values.url || null,
      content_html: values.contentHtml || null,
      ai_system_prompt: values.aiSystemPrompt || null,
      subdomain: values.subdomain || null,
      type: values.type,
      status: values.status,
      is_active: values.isActive,
      is_featured: values.isFeatured,
      sort_order: values.sortOrder,
      required_plan: values.requiredPlan,
    })
    .eq("id", id)
    .eq("tenant_id", ctx.tenant.id);

  if (error) {
    return { error: error.code === "23505" ? "Este subdomínio já está em uso." : error.message };
  }

  await syncVisibleRoles(id, values.visibleToRoleIds);
  await logActivity({
    tenantId: ctx.tenant.id,
    action: "mini_apps.updated",
    entityType: "mini_app",
    entityId: id,
  });
  revalidateAppsSurfaces();
  redirect("/admin/apps");
}

/**
 * Sempre substitui tudo: cada arquivo anterior desse mini-app (objeto no
 * Storage + linha em mini_app_files) é apagado antes do novo conjunto ser
 * gravado — "subir a pasta" é sempre a versão completa, não incremental.
 */
export async function uploadMiniAppFilesAction(
  miniAppId: string,
  formData: FormData
): Promise<MiniAppActionResult> {
  const ctx = await requirePermission(PERMISSIONS.APPS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { data: app } = await supabase
    .from("mini_apps")
    .select("id, type")
    .eq("id", miniAppId)
    .eq("tenant_id", ctx.tenant.id)
    .maybeSingle();
  if (!app) return { error: "Mini-app não encontrado." };
  if (app.type !== "hosted_site") return { error: "Este mini-app não é do tipo Site hospedado." };

  const entries = Array.from(formData.entries()).filter(
    (entry): entry is [string, File] => entry[1] instanceof File
  );

  if (entries.length === 0) return { error: "Nenhum arquivo selecionado." };
  if (entries.length > MAX_FILES) return { error: `Máximo de ${MAX_FILES} arquivos por envio.` };
  if (!entries.some(([path]) => path === "index.html")) {
    return { error: "A pasta precisa conter um arquivo index.html na raiz." };
  }

  let totalBytes = 0;
  for (const [path, file] of entries) {
    if (file.size > MAX_FILE_BYTES) return { error: `"${path}" excede o limite de 10 MB por arquivo.` };
    totalBytes += file.size;
  }
  if (totalBytes > MAX_TOTAL_BYTES) return { error: "O total enviado excede o limite de 30 MB." };

  const admin = createAdminClient();

  const { data: existingFiles } = await admin
    .from("mini_app_files")
    .select("storage_path")
    .eq("mini_app_id", miniAppId);
  if (existingFiles && existingFiles.length > 0) {
    await admin.storage.from("mini-app-files").remove(existingFiles.map((f) => f.storage_path));
    await admin.from("mini_app_files").delete().eq("mini_app_id", miniAppId);
  }

  for (const [path, file] of entries) {
    const storagePath = `${miniAppId}/${path}`;
    const contentType = guessContentType(path, file.type);

    const { error: uploadError } = await admin.storage
      .from("mini-app-files")
      .upload(storagePath, file, { contentType, upsert: true });
    if (uploadError) return { error: `Falha ao enviar "${path}": ${uploadError.message}` };

    const { error: rowError } = await admin.from("mini_app_files").insert({
      tenant_id: ctx.tenant.id,
      mini_app_id: miniAppId,
      path,
      storage_path: storagePath,
      content_type: contentType,
      size_bytes: file.size,
    });
    if (rowError) return { error: rowError.message };
  }

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "mini_apps.files_uploaded",
    entityType: "mini_app",
    entityId: miniAppId,
    metadata: { fileCount: entries.length },
  });
  revalidateAppsSurfaces();
  redirect("/admin/apps");
}

export async function deleteMiniAppAction(id: string): Promise<MiniAppActionResult> {
  const ctx = await requirePermission(PERMISSIONS.APPS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const admin = createAdminClient();
  const { data: files } = await admin.from("mini_app_files").select("storage_path").eq("mini_app_id", id);
  if (files && files.length > 0) {
    await admin.storage.from("mini-app-files").remove(files.map((f) => f.storage_path));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("mini_apps")
    .delete()
    .eq("id", id)
    .eq("tenant_id", ctx.tenant.id);

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "mini_apps.deleted",
    entityType: "mini_app",
    entityId: id,
  });
  revalidateAppsSurfaces();
  return {};
}
