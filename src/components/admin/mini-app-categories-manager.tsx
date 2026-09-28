"use client";

import { Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { MiniAppCategoryDeleteButton } from "@/components/admin/mini-app-delete-button";
import { MiniAppCategoryForm } from "@/components/admin/mini-app-category-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { MiniAppCategory } from "@/core/mini-apps/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";

export function MiniAppCategoriesManager({ categories }: { categories: MiniAppCategory[] }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<MiniAppCategory | null>(null);

  function handleSuccess() {
    setCreateOpen(false);
    setEditing(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{pt.miniApps.category.title}</h2>
          <p className="text-sm text-muted-foreground">{pt.miniApps.category.subtitle}</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="size-4" />
            {pt.miniApps.category.new}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{pt.miniApps.category.new}</DialogTitle>
            </DialogHeader>
            <MiniAppCategoryForm mode="create" onSuccess={handleSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          {pt.miniApps.category.empty}
        </div>
      ) : (
        <div className="flex flex-col divide-y rounded-xl border">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center gap-3 p-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-base">
                {category.icon || "📁"}
              </span>
              <p className="flex-1 text-sm font-medium">{category.name}</p>
              <Button variant="ghost" size="icon-sm" onClick={() => setEditing(category)}>
                <Pencil className="size-4" />
              </Button>
              <MiniAppCategoryDeleteButton id={category.id} />
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
            <MiniAppCategoryForm
              mode="edit"
              categoryId={editing.id}
              defaultValues={{
                name: editing.name,
                slug: editing.slug,
                icon: editing.icon ?? "",
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
