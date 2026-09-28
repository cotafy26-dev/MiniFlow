import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { MiniApp } from "@/core/mini-apps/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";

export function MiniAppCard({ app }: { app: MiniApp }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      {app.image_url ? (
        // Admin-pasted external URL — plain <img>, not next/image, to
        // avoid configuring images.remotePatterns for arbitrary hosts.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={app.image_url}
          alt=""
          className="h-28 w-full rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-28 w-full items-center justify-center rounded-lg bg-muted text-4xl">
          {app.icon || "🧩"}
        </div>
      )}

      <div className="flex-1">
        <p className="font-medium">{app.name}</p>
        {app.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{app.description}</p>
        )}
      </div>

      <Button size="sm" className="w-full" render={<Link href={`/apps/${app.slug}`} />}>
        {pt.apps.card.open}
      </Button>
    </div>
  );
}
