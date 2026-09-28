"use client";

import { Pencil, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { BadgeForm } from "@/components/admin/badge-form";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { Badge as BadgePill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteBadgeAction } from "@/core/gamification/actions";
import type { Badge } from "@/core/gamification/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";

export function BadgesManager({ badges }: { badges: Badge[] }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Badge | null>(null);

  function handleSuccess() {
    setCreateOpen(false);
    setEditing(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{pt.gamification.badges.title}</h2>
          <p className="text-sm text-muted-foreground">{pt.gamification.badges.subtitle}</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="size-4" />
            {pt.gamification.badges.new}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{pt.gamification.badges.new}</DialogTitle>
            </DialogHeader>
            <BadgeForm mode="create" onSuccess={handleSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {badges.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          {pt.gamification.badges.empty}
        </div>
      ) : (
        <div className="flex flex-col divide-y rounded-xl border">
          {badges.map((badge) => (
            <div key={badge.id} className="flex items-center gap-3 p-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-lg">
                {badge.icon || "🏆"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{badge.name}</p>
                  <BadgePill variant="outline">
                    {badge.points_threshold === null
                      ? pt.gamification.badges.manualOnly
                      : `${badge.points_threshold} ${pt.ranking.points}`}
                  </BadgePill>
                  {!badge.is_active && <BadgePill variant="outline">{pt.gamification.badges.inactive}</BadgePill>}
                </div>
                {badge.description && (
                  <p className="truncate text-xs text-muted-foreground">{badge.description}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={pt.gamification.badges.membersTitle}
                render={<Link href={`/admin/gamification/badges/${badge.id}`} />}
              >
                <Users className="size-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => setEditing(badge)}>
                <Pencil className="size-4" />
              </Button>
              <ConfirmDeleteButton
                confirmMessage={pt.gamification.badges.deleteConfirm}
                ariaLabel={pt.miniApps.admin.delete}
                onDelete={() => deleteBadgeAction(badge.id)}
              />
            </div>
          ))}
        </div>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.name}</DialogTitle>
          </DialogHeader>
          {editing && (
            <BadgeForm
              mode="edit"
              badgeId={editing.id}
              defaultValues={{
                name: editing.name,
                description: editing.description ?? "",
                icon: editing.icon ?? "",
                pointsThreshold: editing.points_threshold,
                isActive: editing.is_active,
                sortOrder: editing.sort_order,
              }}
              onSuccess={handleSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
