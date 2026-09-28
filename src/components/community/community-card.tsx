import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Community } from "@/core/communities/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";

export function CommunityCard({ community }: { community: Community }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      {community.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={community.image_url} alt="" className="h-28 w-full rounded-lg object-cover" />
      ) : (
        <div className="flex h-28 w-full items-center justify-center rounded-lg bg-muted text-4xl">
          👥
        </div>
      )}

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{community.name}</p>
          {community.visibility === "closed" && (
            <Badge variant="outline">{pt.community.card.visibilityClosed}</Badge>
          )}
        </div>
        {community.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{community.description}</p>
        )}
      </div>

      <Button size="sm" className="w-full" render={<Link href={`/community/${community.slug}`} />}>
        {pt.community.card.open}
      </Button>
    </div>
  );
}
