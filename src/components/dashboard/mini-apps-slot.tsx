import Link from "next/link";
import { Sparkles } from "lucide-react";

import { MiniAppCard } from "@/components/apps-catalog/mini-app-card";
import type { MiniApp } from "@/core/mini-apps/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";

export function MiniAppsSlot({ miniApps }: { miniApps: MiniApp[] }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">{pt.dashboard.myMiniApps}</h2>
        {miniApps.length > 0 && (
          <Link href="/apps" className="text-sm text-primary hover:underline">
            {pt.dashboard.seeAllApps}
          </Link>
        )}
      </div>

      {miniApps.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-10 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium">{pt.dashboard.miniAppsComingSoonTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">{pt.dashboard.miniAppsComingSoonBody}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {miniApps.map((app) => (
            <MiniAppCard key={app.id} app={app} />
          ))}
        </div>
      )}
    </section>
  );
}
