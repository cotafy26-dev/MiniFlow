"use client";

import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { deleteBannerAction } from "@/core/banners/actions";
import { pt } from "@/lib/i18n/dictionaries/pt";

export function BannerDeleteButton({ id }: { id: string }) {
  return (
    <ConfirmDeleteButton
      confirmMessage={pt.banners.deleteConfirm}
      ariaLabel={pt.banners.delete}
      onDelete={() => deleteBannerAction(id)}
    />
  );
}
