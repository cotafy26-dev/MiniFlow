import Link from "next/link";
import { Folder, Pencil } from "lucide-react";

import { MiniAppDeleteButton } from "@/components/admin/mini-app-delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MiniAppWithRelations } from "@/core/mini-apps/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";

const statusVariant = {
  draft: "secondary",
  published: "default",
  archived: "outline",
} as const;

export function MiniAppList({ apps }: { apps: MiniAppWithRelations[] }) {
  if (apps.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
        {pt.miniApps.admin.empty}
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y rounded-xl border">
      {apps.map((app) => (
        <div key={app.id} className="flex items-center gap-3 p-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-lg">
            {app.icon || "🧩"}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium">{app.name}</p>
              <Badge variant={statusVariant[app.status]}>{pt.miniApps.status[app.status]}</Badge>
              {!app.is_active && <Badge variant="outline">Inativo</Badge>}
              {app.is_featured && <Badge variant="secondary">Destaque</Badge>}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {pt.miniApps.types[app.type]}
              {app.categoryName ? ` · ${app.categoryName}` : ""}
            </p>
          </div>

          {app.type === "hosted_site" && (
            <Button variant="ghost" size="icon-sm" render={<Link href={`/admin/apps/${app.id}/files`} />}>
              <Folder className="size-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon-sm" render={<Link href={`/admin/apps/${app.id}/edit`} />}>
            <Pencil className="size-4" />
          </Button>
          <MiniAppDeleteButton id={app.id} />
        </div>
      ))}
    </div>
  );
}
