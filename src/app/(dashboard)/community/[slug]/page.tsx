import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CommunityJoinButton } from "@/components/community/community-join-button";
import { PostFeed } from "@/components/feed/post-feed";
import { getCommunityBySlug, getMyMembership } from "@/core/communities/queries";
import { getPinnedPosts, getCommunityPosts } from "@/core/posts/queries";
import { PERMISSIONS } from "@/core/permissions/constants";
import { requireTenantContext } from "@/core/permissions/guards";
import { pt } from "@/lib/i18n/dictionaries/pt";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug };
}

export default async function CommunityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await requireTenantContext();
  if (!ctx.tenant) notFound();

  const community = await getCommunityBySlug(ctx.tenant.id, slug);
  if (!community || !community.is_active) notFound();

  const canManage = ctx.isSuperAdmin || ctx.permissions.has(PERMISSIONS.COMMUNITY_MANAGE);
  const canModerate = ctx.isSuperAdmin || ctx.permissions.has(PERMISSIONS.COMMUNITY_MODERATE);

  const membership = await getMyMembership(community.id, ctx.userId);
  const isActiveMember = membership?.status === "active";
  const isBanned = membership?.status === "banned";
  const canView = isActiveMember || canManage || canModerate;

  const [initialPage, pinnedPosts] = canView
    ? await Promise.all([
        getCommunityPosts(ctx.tenant.id, community.id, ctx.userId),
        getPinnedPosts(ctx.tenant.id, ctx.userId, community.id),
      ])
    : [{ posts: [], nextCursor: null }, []];

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{community.name}</h1>
          {community.description && (
            <p className="mt-1 text-sm text-muted-foreground">{community.description}</p>
          )}
        </div>
        {!isBanned && community.visibility === "open" && !canManage && (
          <CommunityJoinButton communityId={community.id} slug={community.slug} isMember={!!isActiveMember} />
        )}
      </div>

      {isBanned ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {pt.community.detail.closedPrompt}
        </p>
      ) : !canView && community.visibility === "closed" ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {pt.community.detail.closedPrompt}
        </p>
      ) : !canView ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {pt.community.detail.joinToParticipate}
        </p>
      ) : (
        <PostFeed
          communityId={community.id}
          currentUserId={ctx.userId}
          canPublishFeed={false}
          canModerate={canModerate}
          // Posting requires actual community membership (RLS's
          // posts_insert checks is_community_member, not community.manage)
          // — an admin who created this community but hasn't joined it
          // yet must add themselves via the member manager first.
          canPost={!!isActiveMember}
          initialPage={initialPage}
          pinnedPosts={pinnedPosts}
        />
      )}
    </div>
  );
}
