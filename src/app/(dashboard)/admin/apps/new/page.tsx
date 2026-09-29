import type { Metadata } from "next";

import { MiniAppForm } from "@/components/admin/mini-app-form";
import { getMiniAppCategories } from "@/core/mini-apps/queries";
import { requireTenantContext } from "@/core/permissions/guards";
import { createClient } from "@/lib/supabase/server";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.miniApps.admin.newApp };

export default async function NewMiniAppPage() {
  const ctx = await requireTenantContext();
  const supabase = await createClient();

  const [categories, { data: roles }] = await Promise.all([
    ctx.tenant ? getMiniAppCategories(ctx.tenant.id) : Promise.resolve([]),
    supabase.from("roles").select("id, key, name").order("name"),
  ]);

  return (
    <div className="flex max-w-lg flex-col gap-5">
      <h2 className="text-lg font-semibold">{pt.miniApps.admin.newApp}</h2>
      <MiniAppForm mode="create" categories={categories} roles={roles ?? []} />
    </div>
  );
}
