import Link from "next/link";
import { Pencil } from "lucide-react";

import { BannerDeleteButton } from "@/components/admin/banner-delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Banner } from "@/core/banners/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function BannerList({ banners }: { banners: Banner[] }) {
  if (banners.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
        {pt.banners.empty}
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y rounded-xl border">
      {banners.map((banner) => {
        const startsAt = formatDate(banner.starts_at);
        const endsAt = formatDate(banner.ends_at);
        return (
          <div key={banner.id} className="flex items-center gap-3 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={banner.image_url}
              alt=""
              className="h-12 w-20 shrink-0 rounded-md border object-cover"
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">{banner.title}</p>
                <Badge variant={banner.is_active ? "default" : "outline"}>
                  {banner.is_active ? pt.banners.active : pt.banners.inactive}
                </Badge>
              </div>
              {(startsAt || endsAt) && (
                <p className="truncate text-xs text-muted-foreground">
                  {startsAt ?? "—"} → {endsAt ?? "—"}
                </p>
              )}
            </div>

            <Button variant="ghost" size="icon-sm" render={<Link href={`/admin/banners/${banner.id}/edit`} />}>
              <Pencil className="size-4" />
            </Button>
            <BannerDeleteButton id={banner.id} />
          </div>
        );
      })}
    </div>
  );
}
