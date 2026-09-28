import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { BannerStrip } from "@/components/dashboard/banner-strip";
import { MiniAppsSlot } from "@/components/dashboard/mini-apps-slot";
import { getActiveBanners } from "@/core/banners/queries";
import { getFeaturedMiniApps } from "@/core/mini-apps/queries";
import { getCurrentTenantContext } from "@/core/tenants/context";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: `Dashboard · ${pt.app.name}` };

export default async function DashboardPage() {
  const ctx = await getCurrentTenantContext();
  if (!ctx) redirect("/login");

  const firstName = ctx.profile.full_name.split(" ")[0];
  const [miniApps, banners] = ctx.tenant
    ? await Promise.all([getFeaturedMiniApps(ctx.tenant.id), getActiveBanners(ctx.tenant.id)])
    : [[], []];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {pt.dashboard.greeting}, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">{pt.dashboard.continueWhereYouLeft}</p>
      </div>

      <BannerStrip banners={banners} />

      <MiniAppsSlot miniApps={miniApps} />
    </div>
  );
}
