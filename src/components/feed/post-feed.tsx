"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { PostCard } from "@/components/feed/post-card";
import { PostComposer } from "@/components/feed/post-composer";
import { fetchCommunityPageAction, fetchFeedPageAction } from "@/core/posts/actions";
import type { PostPage, PostWithMeta } from "@/core/posts/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";

export function PostFeed({
  communityId,
  currentUserId,
  canPublishFeed,
  canModerate,
  canPost,
  initialPage,
  pinnedPosts,
}: {
  communityId: string | null;
  currentUserId: string;
  canPublishFeed: boolean;
  canModerate: boolean;
  /** Whether the composer should render at all — false for a non-member viewing an open community they haven't joined yet. */
  canPost: boolean;
  initialPage: PostPage;
  pinnedPosts: PostWithMeta[];
}) {
  const queryClient = useQueryClient();
  const queryKey = ["posts", communityId ?? "feed"];
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      communityId ? fetchCommunityPageAction(communityId, pageParam) : fetchFeedPageAction(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialData: { pages: [initialPage], pageParams: [undefined] },
  });

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) fetchNextPage();
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  function refresh() {
    queryClient.invalidateQueries({ queryKey });
  }

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];
  const pinnedIds = new Set(pinnedPosts.map((p) => p.id));
  const unpinned = posts.filter((post) => !pinnedIds.has(post.id));

  const isEmpty = pinnedPosts.length === 0 && unpinned.length === 0;

  return (
    <div className="flex flex-col gap-4">
      {canPost && (
        <PostComposer communityId={communityId} onDone={refresh} />
      )}

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-10 text-center">
          <p className="text-sm font-medium">
            {communityId ? pt.community.detail.emptyTitle : pt.feed.emptyTitle}
          </p>
          <p className="text-sm text-muted-foreground">
            {communityId ? pt.community.detail.emptyBody : pt.feed.emptyBody}
          </p>
        </div>
      ) : (
        <>
          {pinnedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              canPublishFeed={canPublishFeed}
              canModerate={canModerate}
              onChanged={refresh}
            />
          ))}
          {unpinned.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              canPublishFeed={canPublishFeed}
              canModerate={canModerate}
              onChanged={refresh}
            />
          ))}
        </>
      )}

      <div ref={sentinelRef} />
      {isFetchingNextPage && <p className="text-center text-sm text-muted-foreground">...</p>}
    </div>
  );
}
