import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MiniAppForm } from "@/components/admin/mini-app-form";
import { getMiniAppById, getMiniAppCategories } from "@/core/mini-apps/queries";
import { requireTenantContext } from "@/core/permissions/guards";
import { createClient } from "@/lib/supabase/server";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.miniApps.admin.edit };

export default async function EditMiniAppPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireTenantContext();
  if (!ctx.tenant) notFound();

  const supabase = await createClient();
  const [app, categories, { data: roles }] = await Promise.all([
    getMiniAppById(ctx.tenant.id, id),
    getMiniAppCategories(ctx.tenant.id),
    supabase.from("roles").select("id, key, name").order("name"),
  ]);

  if (!app) notFound();

  const baseDomain = process.env.APPS_BASE_DOMAIN || null;

  return (
    <div className="flex max-w-lg flex-col gap-5">
      <h2 className="text-lg font-semibold">{app.name}</h2>
      <MiniAppForm
        mode="edit"
        miniAppId={app.id}
        categories={categories}
        roles={roles ?? []}
        baseDomain={baseDomain}
        defaultValues={{
          name: app.name,
          slug: app.slug,
          description: app.description ?? "",
          icon: app.icon ?? "",
          imageUrl: app.image_url ?? "",
          url: app.url ?? "",
          contentHtml: app.content_html ?? "",
          aiSystemPrompt: app.ai_system_prompt ?? "",
          subdomain: app.subdomain ?? "",
          type: app.type,
          status: app.status,
          categoryId: app.category_id,
          requiredPlan: app.required_plan,
          isActive: app.is_active,
          isFeatured: app.is_featured,
          sortOrder: app.sort_order,
          visibleToRoleIds: app.visibleRoleIds,
        }}
      />
    </div>
  );
}
