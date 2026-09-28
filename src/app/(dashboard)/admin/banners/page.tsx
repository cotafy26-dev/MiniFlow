import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { BannerList } from "@/components/admin/banner-list";
import { Button } from "@/components/ui/button";
import { getBannersForAdmin } from "@/core/banners/queries";
import { requireTenantContext } from "@/core/permissions/guards";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.banners.title };

export default async function AdminBannersPage() {
  const ctx = await requireTenantContext();
  const banners = ctx.tenant ? await getBannersForAdmin(ctx.tenant.id) : [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{pt.banners.title}</h2>
          <p className="text-sm text-muted-foreground">{pt.banners.subtitle}</p>
        </div>
        <Button render={<Link href="/admin/banners/new" />}>
          <Plus className="size-4" />
          {pt.banners.newBanner}
        </Button>
      </div>

      <BannerList banners={banners} />
    </div>
  );
}
