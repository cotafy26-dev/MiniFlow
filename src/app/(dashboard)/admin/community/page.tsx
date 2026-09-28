import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { CommunityList } from "@/components/admin/community-list";
import { Button } from "@/components/ui/button";
import { getCommunitiesForAdmin } from "@/core/communities/queries";
import { PERMISSIONS } from "@/core/permissions/constants";
import { requireTenantContext } from "@/core/permissions/guards";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.community.admin.title };

export default async function AdminCommunityPage() {
  const ctx = await requireTenantContext();
  const communities = ctx.tenant ? await getCommunitiesForAdmin(ctx.tenant.id) : [];
  const canModerate = ctx.isSuperAdmin || ctx.permissions.has(PERMISSIONS.COMMUNITY_MODERATE);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{pt.community.admin.title}</h2>
          <p className="text-sm text-muted-foreground">{pt.community.admin.subtitle}</p>
        </div>
        <div className="flex gap-2">
          {canModerate && (
            <Button variant="outline" render={<Link href="/admin/community/moderation" />}>
              {pt.community.admin.moderationLink}
            </Button>
          )}
          {ctx.permissions.has(PERMISSIONS.COMMUNITY_MANAGE) || ctx.isSuperAdmin ? (
            <Button render={<Link href="/admin/community/new" />}>
              <Plus className="size-4" />
              {pt.community.admin.newCommunity}
            </Button>
          ) : null}
        </div>
      </div>

      <CommunityList communities={communities} />
    </div>
  );
}
