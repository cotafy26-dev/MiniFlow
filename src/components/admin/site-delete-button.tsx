"use client";

import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { deleteSiteAction } from "@/core/sites/actions";
import { pt } from "@/lib/i18n/dictionaries/pt";

export function SiteDeleteButton({ id }: { id: string }) {
  return (
    <ConfirmDeleteButton
      confirmMessage={pt.sites.deleteConfirm}
      ariaLabel={pt.sites.delete}
      onDelete={() => deleteSiteAction(id)}
    />
  );
}
