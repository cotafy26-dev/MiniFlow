"use client";

import { useState } from "react";
import { Heart, LinkIcon, MessageCircle, MoreVertical, Pin, Share2 } from "lucide-react";
import { toast } from "sonner";

import { CommentThread } from "@/components/feed/comment-thread";
import { PostComposer } from "@/components/feed/post-composer";
import { ReportDialog } from "@/components/feed/report-dialog";
import { VideoPlayer } from "@/components/lessons/video-player";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  deletePostAction,
  hidePostAction,
  toggleLikeAction,
  togglePinAction,
  toggleShareAction,
  unhidePostAction,
} from "@/core/posts/actions";
import type { PostWithMeta } from "@/core/posts/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";
import { cn } from "@/lib/utils";
import type { PostValues } from "@/lib/validations/posts";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function PostCard({
  post,
  currentUserId,
  canPublishFeed,
  canModerate,
  onChanged,
}: {
  post: PostWithMeta;
  currentUserId: string;
  canPublishFeed: boolean;
  canModerate: boolean;
  onChanged: () => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const isAuthor = post.author_id === currentUserId;
  const canPin = canPublishFeed || canModerate;

  async function handleLike() {
    setIsBusy(true);
    const result = await toggleLikeAction("post", post.id);
    setIsBusy(false);
    if (result?.error) toast.error(result.error);
    else onChanged();
  }

  async function handleShare() {
    const result = await toggleShareAction(post.id);
    if (result?.error) toast.error(result.error);
    else onChanged();
  }

  async function handleDelete() {
    if (!window.confirm(pt.feed.post.deleteConfirm)) return;
    const result = await deletePostAction(post.id);
    if (result?.error) toast.error(result.error);
    else onChanged();
  }

  async function handleTogglePin() {
    const result = await togglePinAction(post.id, !post.is_pinned);
    if (result?.error) toast.error(result.error);
    else onChanged();
  }

  async function handleToggleHide() {
    const result = post.status === "hidden" ? await unhidePostAction(post.id) : await hidePostAction(post.id);
    if (result?.error) toast.error(result.error);
    else onChanged();
  }

  if (isEditing) {
    return (
      <PostComposer
        communityId={post.community_id}
        mode="edit"
        postId={post.id}
        defaultValues={{
          communityId: post.community_id,
          contentType: post.content_type as PostValues["contentType"],
          bodyText: post.body_text ?? "",
          imageUrl: post.image_url ?? "",
          videoUrl: post.video_url ?? "",
          linkUrl: post.link_url ?? "",
        }}
        onDone={() => {
          setIsEditing(false);
          onChanged();
        }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarFallback>{initials(post.authorName)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{post.authorName}</p>
            <p className="text-xs text-muted-foreground">{formatDate(post.created_at)}</p>
          </div>
          {post.is_pinned && (
            <Badge variant="outline">
              <Pin className="size-3" /> {pt.feed.post.pinnedBadge}
            </Badge>
          )}
          {post.status === "hidden" && <Badge variant="outline">{pt.feed.post.hiddenBadge}</Badge>}
        </div>

        {(isAuthor || canPin || canModerate || !isAuthor) && (
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-md p-1 text-muted-foreground hover:bg-accent">
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isAuthor && (
                <DropdownMenuItem onClick={() => setIsEditing(true)}>{pt.feed.post.editAction}</DropdownMenuItem>
              )}
              {isAuthor && (
                <DropdownMenuItem onClick={handleDelete}>{pt.feed.post.deleteAction}</DropdownMenuItem>
              )}
              {canPin && (
                <DropdownMenuItem onClick={handleTogglePin}>
                  {post.is_pinned ? pt.feed.post.unpinAction : pt.feed.post.pinAction}
                </DropdownMenuItem>
              )}
              {canModerate && (
                <DropdownMenuItem onClick={handleToggleHide}>
                  {post.status === "hidden" ? pt.feed.post.unhideAction : pt.feed.post.hideAction}
                </DropdownMenuItem>
              )}
              {!isAuthor && (
                <DropdownMenuItem onClick={() => setReportOpen(true)}>
                  {pt.feed.post.reportAction}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {post.body_text && <p className="whitespace-pre-wrap text-sm">{post.body_text}</p>}
      {post.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.image_url} alt="" className="max-h-96 w-full rounded-lg object-cover" />
      )}
      {post.video_url && <VideoPlayer url={post.video_url} title={post.authorName} />}
      {post.link_url && (
        <a
          href={post.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg border p-3 text-sm text-primary hover:bg-accent"
        >
          <LinkIcon className="size-4" />
          <span className="truncate">{post.link_url}</span>
        </a>
      )}

      <div className="flex items-center gap-4 border-t pt-2 text-sm text-muted-foreground">
        <button type="button" disabled={isBusy} onClick={handleLike} className="flex items-center gap-1.5">
          <Heart className={cn("size-4", post.likedByMe && "fill-current text-destructive")} />
          {pt.feed.post.likeButton}
          {post.likeCount > 0 && <span>({post.likeCount})</span>}
        </button>
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5"
        >
          <MessageCircle className="size-4" />
          {pt.feed.post.commentButton}
          {post.commentCount > 0 && <span>({post.commentCount})</span>}
        </button>
        <button type="button" onClick={handleShare} className="flex items-center gap-1.5">
          <Share2 className="size-4" />
          {pt.feed.post.shareButton}
          {post.shareCount > 0 && <span>({post.shareCount})</span>}
        </button>
      </div>

      {showComments && (
        <CommentThread postId={post.id} currentUserId={currentUserId} canModerate={canModerate} />
      )}

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetType="post"
        targetId={post.id}
      />
    </div>
  );
}
