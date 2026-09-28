import Link from "next/link";
import { Pencil } from "lucide-react";

import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteCommunityAction } from "@/core/communities/actions";
import type { Community } from "@/core/communities/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";

export function CommunityList({ communities }: { communities: Community[] }) {
  if (communities.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
        {pt.community.admin.empty}
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y rounded-xl border">
      {communities.map((community) => (
        <div key={community.id} className="flex items-center gap-3 p-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-lg">
            👥
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium">{community.name}</p>
              {community.visibility === "closed" && (
                <Badge variant="outline">{pt.community.admin.visibility.closed}</Badge>
              )}
              {!community.is_active && <Badge variant="outline">Inativa</Badge>}
            </div>
            {community.description && (
              <p className="truncate text-xs text-muted-foreground">{community.description}</p>
            )}
          </div>

          <Button variant="ghost" size="icon-sm" render={<Link href={`/admin/community/${community.id}`} />}>
            <Pencil className="size-4" />
          </Button>
          <ConfirmDeleteButton
            confirmMessage={pt.community.admin.deleteConfirm}
            ariaLabel="Excluir"
            onDelete={() => deleteCommunityAction(community.id)}
          />
        </div>
      ))}
    </div>
  );
}
