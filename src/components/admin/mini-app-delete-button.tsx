"use client";

import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { deleteMiniAppAction, deleteMiniAppCategoryAction } from "@/core/mini-apps/actions";
import { pt } from "@/lib/i18n/dictionaries/pt";

export function MiniAppDeleteButton({ id }: { id: string }) {
  return (
    <ConfirmDeleteButton
      confirmMessage={pt.miniApps.admin.deleteConfirm}
      ariaLabel={pt.miniApps.admin.delete}
      onDelete={() => deleteMiniAppAction(id)}
    />
  );
}

export function MiniAppCategoryDeleteButton({ id }: { id: string }) {
  return (
    <ConfirmDeleteButton
      confirmMessage={pt.miniApps.category.deleteConfirm}
      ariaLabel={pt.miniApps.admin.delete}
      onDelete={() => deleteMiniAppCategoryAction(id)}
    />
  );
}
