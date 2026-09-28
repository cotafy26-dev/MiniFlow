import "server-only";

import { getPublicProfiles } from "@/core/users/queries";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];

export interface PostWithMeta extends Post {
  authorName: string;
  authorAvatarUrl: string | null;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  shareCount: number;
}

export interface CommentWithMeta extends Comment {
  authorName: string;
  authorAvatarUrl: string | null;
  likeCount: number;
  likedByMe: boolean;
}

export interface PostPage {
  posts: PostWithMeta[];
  nextCursor: string | null;
}

const DEFAULT_PAGE_SIZE = 20;

/**
 * Attaches author/like/comment/share metadata to a page of posts in a
 * handful of batched queries (never N+1 per post). RLS already restricts
 * `posts` to what the viewer may see — this only decorates rows already
 * returned by a query, never widens visibility.
 */
async function attachPostMeta(posts: Post[], viewerId: string): Promise<PostWithMeta[]> {
  if (posts.length === 0) return [];
  const supabase = await createClient();
  const postIds = posts.map((p) => p.id);

  const [profiles, { data: likes }, { data: myLikes }, { data: comments }, { data: shares }] =
    await Promise.all([
      getPublicProfiles(posts.map((p) => p.author_id)),
      supabase.from("likes").select("target_id").eq("target_type", "post").in("target_id", postIds),
      supabase
        .from("likes")
        .select("target_id")
        .eq("target_type", "post")
        .eq("user_id", viewerId)
        .in("target_id", postIds),
      supabase.from("comments").select("post_id").in("post_id", postIds),
      supabase.from("post_shares").select("post_id").in("post_id", postIds),
    ]);

  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const countBy = (rows: { [key: string]: unknown }[] | null, key: string) => {
    const counts = new Map<string, number>();
    for (const row of rows ?? []) {
      const id = row[key] as string;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  };
  const likeCounts = countBy(likes, "target_id");
  const commentCounts = countBy(comments, "post_id");
  const shareCounts = countBy(shares, "post_id");
  const myLikeIds = new Set((myLikes ?? []).map((l) => l.target_id));

  return posts.map((post) => {
    const profile = profileById.get(post.author_id);
    return {
      ...post,
      authorName: profile?.fullName ?? "—",
      authorAvatarUrl: profile?.avatarUrl ?? null,
      likeCount: likeCounts.get(post.id) ?? 0,
      likedByMe: myLikeIds.has(post.id),
      commentCount: commentCounts.get(post.id) ?? 0,
      shareCount: shareCounts.get(post.id) ?? 0,
    };
  });
}

/**
 * Keyset pagination on created_at. Pinned posts are fetched separately
 * (getPinnedPosts) and rendered above this stream — mixing
 * `order by is_pinned desc, created_at desc` into one query would break
 * the simple `created_at < cursor` predicate used here.
 */
export async function getFeedPosts(
  tenantId: string,
  viewerId: string,
  { cursor, limit = DEFAULT_PAGE_SIZE }: { cursor?: string; limit?: number } = {}
): Promise<PostPage> {
  const supabase = await createClient();
  let query = supabase
    .from("posts")
    .select("*")
    .eq("tenant_id", tenantId)
    .is("community_id", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (cursor) query = query.lt("created_at", cursor);

  const { data } = await query;
  const posts = data ?? [];
  return {
    posts: await attachPostMeta(posts, viewerId),
    nextCursor: posts.length === limit ? posts[posts.length - 1].created_at : null,
  };
}

export async function getCommunityPosts(
  tenantId: string,
  communityId: string,
  viewerId: string,
  { cursor, limit = DEFAULT_PAGE_SIZE }: { cursor?: string; limit?: number } = {}
): Promise<PostPage> {
  const supabase = await createClient();
  let query = supabase
    .from("posts")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("community_id", communityId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (cursor) query = query.lt("created_at", cursor);

  const { data } = await query;
  const posts = data ?? [];
  return {
    posts: await attachPostMeta(posts, viewerId),
    nextCursor: posts.length === limit ? posts[posts.length - 1].created_at : null,
  };
}

export async function getPinnedPosts(
  tenantId: string,
  viewerId: string,
  communityId: string | null
): Promise<PostWithMeta[]> {
  const supabase = await createClient();
  let query = supabase
    .from("posts")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_pinned", true)
    .order("created_at", { ascending: false });
  query = communityId ? query.eq("community_id", communityId) : query.is("community_id", null);

  const { data } = await query;
  return attachPostMeta(data ?? [], viewerId);
}

export async function getPostById(id: string): Promise<Post | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
  return data;
}

/**
 * Flat list, ordered oldest-first; the caller builds the (single-level)
 * parent/reply tree in memory via parent_comment_id.
 */
export async function getCommentsForPost(postId: string, viewerId: string): Promise<CommentWithMeta[]> {
  const supabase = await createClient();
  const { data: comments } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (!comments || comments.length === 0) return [];
  const commentIds = comments.map((c) => c.id);

  const [profiles, { data: likes }, { data: myLikes }] = await Promise.all([
    getPublicProfiles(comments.map((c) => c.author_id)),
    supabase.from("likes").select("target_id").eq("target_type", "comment").in("target_id", commentIds),
    supabase
      .from("likes")
      .select("target_id")
      .eq("target_type", "comment")
      .eq("user_id", viewerId)
      .in("target_id", commentIds),
  ]);

  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const likeCounts = new Map<string, number>();
  for (const like of likes ?? []) {
    likeCounts.set(like.target_id, (likeCounts.get(like.target_id) ?? 0) + 1);
  }
  const myLikeIds = new Set((myLikes ?? []).map((l) => l.target_id));

  return comments.map((comment) => {
    const profile = profileById.get(comment.author_id);
    return {
      ...comment,
      authorName: profile?.fullName ?? "—",
      authorAvatarUrl: profile?.avatarUrl ?? null,
      likeCount: likeCounts.get(comment.id) ?? 0,
      likedByMe: myLikeIds.has(comment.id),
    };
  });
}
