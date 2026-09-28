import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CommunityForm } from "@/components/admin/community-form";
import { CommunityMemberManager } from "@/components/admin/community-member-manager";
import { getCommunityById, getCommunityMembers } from "@/core/communities/queries";
import { requireTenantContext } from "@/core/permissions/guards";
import { getTenantMembersForAdmin } from "@/core/users/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: id };
}

export default async function AdminCommunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireTenantContext();
  if (!ctx.tenant) notFound();

  const [community, members, tenantMembers] = await Promise.all([
    getCommunityById(ctx.tenant.id, id),
    getCommunityMembers(id),
    getTenantMembersForAdmin(ctx.tenant.id),
  ]);

  if (!community) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex max-w-lg flex-col gap-5">
        <h2 className="text-lg font-semibold">{pt.community.admin.editCommunity}</h2>
        <CommunityForm
          mode="edit"
          communityId={community.id}
          defaultValues={{
            name: community.name,
            slug: community.slug,
            description: community.description ?? "",
            imageUrl: community.image_url ?? "",
            visibility: community.visibility as "open" | "closed",
            isActive: community.is_active,
            sortOrder: community.sort_order,
          }}
        />
      </div>

      <CommunityMemberManager communityId={community.id} members={members} tenantMembers={tenantMembers} />
    </div>
  );
}
