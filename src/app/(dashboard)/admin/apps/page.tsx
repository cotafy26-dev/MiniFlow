import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { MiniAppList } from "@/components/admin/mini-app-list";
import { Button } from "@/components/ui/button";
import { getMiniAppsForAdmin } from "@/core/mini-apps/queries";
import { requireTenantContext } from "@/core/permissions/guards";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.miniApps.admin.title };

export default async function AdminAppsPage() {
  const ctx = await requireTenantContext();
  const apps = ctx.tenant ? await getMiniAppsForAdmin(ctx.tenant.id) : [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{pt.miniApps.admin.title}</h2>
          <p className="text-sm text-muted-foreground">{pt.miniApps.admin.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/admin/apps/categories" />}>
            {pt.miniApps.admin.manageCategories}
          </Button>
          <Button render={<Link href="/admin/apps/new" />}>
            <Plus className="size-4" />
            {pt.miniApps.admin.newApp}
          </Button>
        </div>
      </div>

      <MiniAppList apps={apps} />
    </div>
  );
}
