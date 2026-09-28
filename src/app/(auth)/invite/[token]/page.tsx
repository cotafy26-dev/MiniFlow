import type { Metadata } from "next";

import { AcceptInvitationForm } from "@/components/auth/accept-invitation-form";
import { getInvitationByToken } from "@/core/invitations/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.invite.title };

export default async function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-lg font-semibold">{pt.invite.notFound}</h1>
        <p className="text-sm text-muted-foreground">{pt.invite.notFoundBody}</p>
      </div>
    );
  }

  if (invitation.status === "accepted") {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-lg font-semibold">{pt.invite.alreadyAccepted}</h1>
      </div>
    );
  }

  if (invitation.status !== "pending" || new Date(invitation.expiresAt) < new Date()) {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-lg font-semibold">{pt.invite.expired}</h1>
        <p className="text-sm text-muted-foreground">{pt.invite.notFoundBody}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">{pt.invite.title}</h1>
        <p className="text-sm text-muted-foreground">
          {invitation.tenantName} · {invitation.roleName}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{invitation.email}</p>
      </div>

      <AcceptInvitationForm token={token} />
    </div>
  );
}
