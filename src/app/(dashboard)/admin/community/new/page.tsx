import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CommunityForm } from "@/components/admin/community-form";
import { PERMISSIONS } from "@/core/permissions/constants";
import { requireTenantContext } from "@/core/permissions/guards";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.community.admin.newCommunity };

export default async function NewCommunityPage() {
  const ctx = await requireTenantContext();
  if (!ctx.isSuperAdmin && !ctx.permissions.has(PERMISSIONS.COMMUNITY_MANAGE)) {
    redirect("/admin/community");
  }

  return (
    <div className="flex max-w-lg flex-col gap-5">
      <h2 className="text-lg font-semibold">{pt.community.admin.newCommunity}</h2>
      <CommunityForm mode="create" />
    </div>
  );
}
