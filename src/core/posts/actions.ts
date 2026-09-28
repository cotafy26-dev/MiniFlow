"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/core/activity-log/log";
import { awardPoints } from "@/core/gamification/actions";
import { PERMISSIONS } from "@/core/permissions/constants";
import { requireTenantContext } from "@/core/permissions/guards";
import {
  getCommentsForPost,
  getCommunityPosts,
  getFeedPosts,
  type CommentWithMeta,
  type PostPage,
} from "@/core/posts/queries";
import type { TenantContext } from "@/core/tenants/context";
import { createClient } from "@/lib/supabase/server";
import type { CommentValues, PostValues, ReportValues } from "@/lib/validations/posts";

// ---------------------------------------------------------------------------
// Client-side pagination fetchers (used by the useInfiniteQuery-based feed)
// ---------------------------------------------------------------------------

export async function fetchFeedPageAction(cursor?: string): Promise<PostPage> {
  const ctx = await requireTenantContext();
  if (!ctx.tenant) return { posts: [], nextCursor: null };
  return getFeedPosts(ctx.tenant.id, ctx.userId, { cursor });
}

export async function fetchCommunityPageAction(
  communityId: string,
  cursor?: string
): Promise<PostPage> {
  const ctx = await requireTenantContext();
  if (!ctx.tenant) return { posts: [], nextCursor: null };
  return getCommunityPosts(ctx.tenant.id, communityId, ctx.userId, { cursor });
}

export async function fetchCommentsAction(postId: string): Promise<CommentWithMeta[]> {
  const ctx = await requireTenantContext();
  return getCommentsForPost(postId, ctx.userId);
}

export interface PostActionResult {
  error?: string;
}

function revalidatePostSurfaces(communityId: string | null) {
  revalidatePath("/feed");
  if (communityId) revalidatePath("/community/[slug]", "page");
}

async function requireModerationAccess(): Promise<TenantContext> {
  const ctx = await requireTenantContext();
  if (!ctx.isSuperAdmin && !ctx.permissions.has(PERMISSIONS.COMMUNITY_MODERATE)) {
    throw new Error("Missing permission: community.moderate");
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

export async function createPostAction(values: PostValues): Promise<PostActionResult> {
  const ctx = await requireTenantContext();
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      tenant_id: ctx.tenant.id,
      community_id: values.communityId,
      author_id: ctx.userId,
      content_type: values.contentType,
      body_text: values.bodyText || null,
      image_url: values.imageUrl || null,
      video_url: values.videoUrl || null,
      link_url: values.linkUrl || null,
    })
    .select("id")
    .single();

  // RLS is the real gate (feed.publish for community_id=null, community
  // membership otherwise) — a denial surfaces here as a plain Postgres error.
  if (error) return { error: "Não foi possível publicar. Verifique sua permissão." };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "posts.created",
    entityType: "post",
    metadata: { communityId: values.communityId },
  });
  await awardPoints("post_created", "post", post.id);
  revalidatePostSurfaces(values.communityId);
  return {};
}

export async function updatePostAction(id: string, values: PostValues): Promise<PostActionResult> {
  const ctx = await requireTenantContext();
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("author_id, tenant_id, community_id")
    .eq("id", id)
    .maybeSingle();

  if (!post) return { error: "Post não encontrado." };
  // Content edits are author-only — moderators use hide/pin instead, never
  // this path, even though posts_moderate_update would technically let an
  // UPDATE through at the RLS layer too.
  if (post.author_id !== ctx.userId) return { error: "Apenas o autor pode editar este post." };

  const { error } = await supabase
    .from("posts")
    .update({
      content_type: values.contentType,
      body_text: values.bodyText || null,
      image_url: values.imageUrl || null,
      video_url: values.videoUrl || null,
      link_url: values.linkUrl || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await logActivity({
    tenantId: post.tenant_id,
    action: "posts.updated",
    entityType: "post",
    entityId: id,
  });
  revalidatePostSurfaces(post.community_id);
  return {};
}

export async function deletePostAction(id: string): Promise<PostActionResult> {
  const ctx = await requireTenantContext();
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("author_id, tenant_id, community_id")
    .eq("id", id)
    .maybeSingle();

  if (!post) return { error: "Post não encontrado." };
  if (post.author_id !== ctx.userId) return { error: "Apenas o autor pode excluir este post." };

  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) return { error: error.message };

  await logActivity({
    tenantId: post.tenant_id,
    action: "posts.deleted",
    entityType: "post",
    entityId: id,
  });
  revalidatePostSurfaces(post.community_id);
  return {};
}

export async function togglePinAction(id: string, pinned: boolean): Promise<PostActionResult> {
  const ctx = await requireTenantContext();
  if (
    !ctx.isSuperAdmin &&
    !ctx.permissions.has(PERMISSIONS.FEED_PUBLISH) &&
    !ctx.permissions.has(PERMISSIONS.COMMUNITY_MODERATE)
  ) {
    return { error: "Sem permissão para fixar este post." };
  }

  const supabase = await createClient();
  const { data: post, error } = await supabase
    .from("posts")
    .update({ is_pinned: pinned })
    .eq("id", id)
    .select("tenant_id, community_id")
    .single();

  if (error) return { error: error.message };

  await logActivity({
    tenantId: post.tenant_id,
    action: pinned ? "posts.pinned" : "posts.unpinned",
    entityType: "post",
    entityId: id,
  });
  revalidatePostSurfaces(post.community_id);
  return {};
}

export async function hidePostAction(id: string): Promise<PostActionResult> {
  const ctx = await requireModerationAccess();
  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from("posts")
    .update({ status: "hidden", deleted_by: ctx.userId, deleted_at: new Date().toISOString() })
    .eq("id", id)
    .select("tenant_id, community_id")
    .single();

  if (error) return { error: error.message };

  await logActivity({
    tenantId: post.tenant_id,
    action: "posts.hidden",
    entityType: "post",
    entityId: id,
  });
  revalidatePostSurfaces(post.community_id);
  return {};
}

export async function unhidePostAction(id: string): Promise<PostActionResult> {
  await requireModerationAccess();
  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from("posts")
    .update({ status: "published", deleted_by: null, deleted_at: null })
    .eq("id", id)
    .select("tenant_id, community_id")
    .single();

  if (error) return { error: error.message };

  await logActivity({
    tenantId: post.tenant_id,
    action: "posts.unhidden",
    entityType: "post",
    entityId: id,
  });
  revalidatePostSurfaces(post.community_id);
  return {};
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export async function createCommentAction(
  postId: string,
  communityId: string | null,
  values: CommentValues
): Promise<PostActionResult> {
  const ctx = await requireTenantContext();
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { data: comment, error } = await supabase
    .from("comments")
    .insert({
      tenant_id: ctx.tenant.id,
      post_id: postId,
      author_id: ctx.userId,
      parent_comment_id: values.parentCommentId || null,
      body: values.body,
    })
    .select("id")
    .single();

  if (error) return { error: "Não foi possível comentar." };

  await awardPoints("comment_created", "comment", comment.id);
  revalidatePostSurfaces(communityId);
  return {};
}

export async function deleteCommentAction(
  id: string,
  communityId: string | null
): Promise<PostActionResult> {
  const ctx = await requireTenantContext();
  const supabase = await createClient();

  const { data: comment } = await supabase
    .from("comments")
    .select("author_id")
    .eq("id", id)
    .maybeSingle();

  if (!comment) return { error: "Comentário não encontrado." };
  if (comment.author_id !== ctx.userId) return { error: "Apenas o autor pode excluir este comentário." };

  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePostSurfaces(communityId);
  return {};
}

export async function hideCommentAction(
  id: string,
  communityId: string | null
): Promise<PostActionResult> {
  const ctx = await requireModerationAccess();
  const supabase = await createClient();

  const { error } = await supabase
    .from("comments")
    .update({ status: "hidden", deleted_by: ctx.userId, deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePostSurfaces(communityId);
  return {};
}

// ---------------------------------------------------------------------------
// Likes / shares
// ---------------------------------------------------------------------------

export async function toggleLikeAction(
  targetType: "post" | "comment",
  targetId: string
): Promise<PostActionResult> {
  const ctx = await requireTenantContext();
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("likes")
    .select("id")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .eq("user_id", ctx.userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("likes").delete().eq("id", existing.id);
    if (error) return { error: error.message };
    return {};
  }

  const { error } = await supabase.from("likes").insert({
    tenant_id: ctx.tenant.id,
    target_type: targetType,
    target_id: targetId,
    user_id: ctx.userId,
  });
  if (error) return { error: "Não foi possível curtir." };
  return {};
}

export async function toggleShareAction(postId: string): Promise<PostActionResult> {
  const ctx = await requireTenantContext();
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase.from("post_shares").upsert(
    { tenant_id: ctx.tenant.id, post_id: postId, user_id: ctx.userId },
    { onConflict: "post_id,user_id", ignoreDuplicates: true }
  );
  if (error) return { error: "Não foi possível compartilhar." };
  return {};
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export async function createReportAction(values: ReportValues): Promise<PostActionResult> {
  const ctx = await requireTenantContext();
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase.from("content_reports").insert({
    tenant_id: ctx.tenant.id,
    target_type: values.targetType,
    target_id: values.targetId,
    reporter_id: ctx.userId,
    reason: values.reason,
  });

  if (error) return { error: "Não foi possível enviar a denúncia." };

  revalidatePath("/admin/community/moderation");
  return {};
}

export async function resolveReportAction(id: string): Promise<PostActionResult> {
  const ctx = await requireModerationAccess();
  const supabase = await createClient();

  const { error } = await supabase
    .from("content_reports")
    .update({ status: "resolved", resolved_by: ctx.userId, resolved_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/community/moderation");
  return {};
}

export async function dismissReportAction(id: string): Promise<PostActionResult> {
  const ctx = await requireModerationAccess();
  const supabase = await createClient();

  const { error } = await supabase
    .from("content_reports")
    .update({ status: "dismissed", resolved_by: ctx.userId, resolved_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/community/moderation");
  return {};
}
