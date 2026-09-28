import type { Metadata } from "next";

import { PostFeed } from "@/components/feed/post-feed";
import { getFeedPosts, getPinnedPosts } from "@/core/posts/queries";
import { PERMISSIONS } from "@/core/permissions/constants";
import { requireTenantContext } from "@/core/permissions/guards";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.feed.title };

export default async function FeedPage() {
  const ctx = await requireTenantContext();
  const canPublishFeed = ctx.isSuperAdmin || ctx.permissions.has(PERMISSIONS.FEED_PUBLISH);
  const canModerate = ctx.isSuperAdmin || ctx.permissions.has(PERMISSIONS.COMMUNITY_MODERATE);

  const [initialPage, pinnedPosts] = ctx.tenant
    ? await Promise.all([
        getFeedPosts(ctx.tenant.id, ctx.userId),
        getPinnedPosts(ctx.tenant.id, ctx.userId, null),
      ])
    : [{ posts: [], nextCursor: null }, []];

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{pt.feed.title}</h1>
      <PostFeed
        communityId={null}
        currentUserId={ctx.userId}
        canPublishFeed={canPublishFeed}
        canModerate={canModerate}
        canPost={canPublishFeed}
        initialPage={initialPage}
        pinnedPosts={pinnedPosts}
      />
    </div>
  );
}
