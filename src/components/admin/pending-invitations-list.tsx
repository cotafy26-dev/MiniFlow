import { PendingInvitationRevokeButton } from "@/components/admin/pending-invitation-revoke-button";
import type { PendingInvitation } from "@/core/invitations/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";

function formatExpiresAt(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function PendingInvitationsList({ invitations }: { invitations: PendingInvitation[] }) {
  if (invitations.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">{pt.members.pendingTitle}</h3>
      <div className="flex flex-col divide-y rounded-xl border">
        {invitations.map((invitation) => (
          <div key={invitation.id} className="flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{invitation.email}</p>
              <p className="truncate text-xs text-muted-foreground">
                {invitation.roleName} · {pt.members.expiresIn} {formatExpiresAt(invitation.expires_at)}
              </p>
            </div>
            <PendingInvitationRevokeButton id={invitation.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
