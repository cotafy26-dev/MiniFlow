"use client";

import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { revokeInvitationAction } from "@/core/invitations/actions";
import { pt } from "@/lib/i18n/dictionaries/pt";

export function PendingInvitationRevokeButton({ id }: { id: string }) {
  return (
    <ConfirmDeleteButton
      confirmMessage={pt.members.revokeConfirm}
      ariaLabel={pt.members.revoke}
      onDelete={() => revokeInvitationAction(id)}
    />
  );
}
