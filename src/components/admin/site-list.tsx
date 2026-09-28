import Link from "next/link";
import { Pencil } from "lucide-react";

import { SiteDeleteButton } from "@/components/admin/site-delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Site } from "@/core/sites/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";

export function SiteList({ sites, baseDomain }: { sites: Site[]; baseDomain: string | null }) {
  if (sites.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
        {pt.sites.empty}
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y rounded-xl border">
      {sites.map((site) => (
        <div key={site.id} className="flex items-center gap-3 p-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium">{site.name}</p>
              <Badge variant={site.is_active ? "default" : "outline"}>
                {site.is_active ? pt.sites.isActive : pt.banners.inactive}
              </Badge>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {baseDomain ? `${site.subdomain}.${baseDomain}` : site.subdomain}
            </p>
          </div>

          <Button variant="outline" size="sm" render={<Link href={`/admin/sites/${site.id}/content`} />}>
            {pt.sites.contentTitle}
          </Button>
          <Button variant="ghost" size="icon-sm" render={<Link href={`/admin/sites/${site.id}/edit`} />}>
            <Pencil className="size-4" />
          </Button>
          <SiteDeleteButton id={site.id} />
        </div>
      ))}
    </div>
  );
}
