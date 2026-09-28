"use client";

import { Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { GamificationLevelForm } from "@/components/admin/gamification-level-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteLevelAction } from "@/core/gamification/actions";
import type { GamificationLevel } from "@/core/gamification/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";

export function GamificationLevelsManager({ levels }: { levels: GamificationLevel[] }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<GamificationLevel | null>(null);

  function handleSuccess() {
    setCreateOpen(false);
    setEditing(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{pt.gamification.levels.title}</h2>
          <p className="text-sm text-muted-foreground">{pt.gamification.levels.subtitle}</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="size-4" />
            {pt.gamification.levels.new}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{pt.gamification.levels.new}</DialogTitle>
            </DialogHeader>
            <GamificationLevelForm mode="create" onSuccess={handleSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {levels.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          {pt.gamification.levels.empty}
        </div>
      ) : (
        <div className="flex flex-col divide-y rounded-xl border">
          {levels.map((level) => (
            <div key={level.id} className="flex items-center gap-3 p-3">
              <div className="flex-1">
                <p className="text-sm font-medium">{level.name}</p>
                <p className="text-xs text-muted-foreground">
                  {level.min_points} {pt.ranking.points}
                </p>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => setEditing(level)}>
                <Pencil className="size-4" />
              </Button>
              <ConfirmDeleteButton
                confirmMessage={pt.gamification.levels.deleteConfirm}
                ariaLabel={pt.miniApps.admin.delete}
                onDelete={() => deleteLevelAction(level.id)}
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
            <GamificationLevelForm
              mode="edit"
              levelId={editing.id}
              defaultValues={{
                name: editing.name,
                minPoints: editing.min_points,
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
