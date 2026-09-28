import type { Metadata } from "next";

import { InviteMemberDialog } from "@/components/admin/invite-member-dialog";
import { MembersManager } from "@/components/admin/members-manager";
import { PendingInvitationsList } from "@/components/admin/pending-invitations-list";
import { getPendingInvitations } from "@/core/invitations/queries";
import { PERMISSIONS } from "@/core/permissions/constants";
import { requireTenantContext } from "@/core/permissions/guards";
import { getRoles, getTenantMembersFull } from "@/core/users/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.members.title };

export default async function AdminMembersPage() {
  const ctx = await requireTenantContext();
  const canManage = ctx.isSuperAdmin || ctx.permissions.has(PERMISSIONS.MEMBERS_MANAGE);

  const [members, roles, invitations] = ctx.tenant
    ? await Promise.all([
        getTenantMembersFull(ctx.tenant.id),
        getRoles(),
        getPendingInvitations(ctx.tenant.id),
      ])
    : [[], [], []];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{pt.members.title}</h2>
          <p className="text-sm text-muted-foreground">{pt.members.subtitle}</p>
        </div>
        {canManage && <InviteMemberDialog roles={roles} />}
      </div>

      {canManage && <PendingInvitationsList invitations={invitations} />}

      <MembersManager members={members} roles={roles} canManage={canManage} />
    </div>
  );
}
