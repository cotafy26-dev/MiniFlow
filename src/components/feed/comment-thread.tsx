"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  createCommentAction,
  deleteCommentAction,
  fetchCommentsAction,
  hideCommentAction,
  toggleLikeAction,
} from "@/core/posts/actions";
import type { CommentWithMeta } from "@/core/posts/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function CommentRow({
  comment,
  isReply,
  currentUserId,
  canModerate,
  onReply,
  onChanged,
}: {
  comment: CommentWithMeta;
  isReply: boolean;
  currentUserId: string;
  canModerate: boolean;
  onReply?: () => void;
  onChanged: () => void;
}) {
  const [isBusy, setIsBusy] = useState(false);
  const isAuthor = comment.author_id === currentUserId;

  async function handleLike() {
    setIsBusy(true);
    const result = await toggleLikeAction("comment", comment.id);
    setIsBusy(false);
    if (result?.error) toast.error(result.error);
    else onChanged();
  }

  async function handleDelete() {
    if (!window.confirm(pt.feed.comments.deleteConfirm)) return;
    const result = await deleteCommentAction(comment.id, null);
    if (result?.error) toast.error(result.error);
    else onChanged();
  }

  async function handleHide() {
    const result = await hideCommentAction(comment.id, null);
    if (result?.error) toast.error(result.error);
    else onChanged();
  }

  if (comment.status === "hidden" && !canModerate && !isAuthor) return null;

  return (
    <div className={cn("flex gap-2", isReply && "ml-9")}>
      <Avatar size="sm">
        <AvatarFallback>{initials(comment.authorName)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="rounded-lg bg-muted px-3 py-2">
          <p className="text-sm font-medium">{comment.authorName}</p>
          <p className="text-sm">{comment.body}</p>
        </div>
        <div className="mt-1 flex items-center gap-3 px-1 text-xs text-muted-foreground">
          <button type="button" disabled={isBusy} onClick={handleLike} className="flex items-center gap-1">
            <Heart className={cn("size-3", comment.likedByMe && "fill-current text-destructive")} />
            {comment.likeCount > 0 && comment.likeCount}
          </button>
          {!isReply && onReply && (
            <button type="button" onClick={onReply}>
              {pt.feed.comments.replyAction}
            </button>
          )}
          {isAuthor && (
            <button type="button" onClick={handleDelete}>
              {pt.feed.comments.deleteAction}
            </button>
          )}
          {canModerate && !isAuthor && comment.status === "published" && (
            <button type="button" onClick={handleHide}>
              {pt.feed.comments.hideAction}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function CommentThread({
  postId,
  currentUserId,
  canModerate,
}: {
  postId: string;
  currentUserId: string;
  canModerate: boolean;
}) {
  const queryClient = useQueryClient();
  const queryKey = ["comments", postId];
  const { data: comments } = useQuery({
    queryKey,
    queryFn: () => fetchCommentsAction(postId),
  });
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [newBody, setNewBody] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function load() {
    queryClient.invalidateQueries({ queryKey });
  }

  async function handleSubmitTop() {
    if (!newBody.trim()) return;
    setIsSubmitting(true);
    const result = await createCommentAction(postId, null, { body: newBody, parentCommentId: null });
    setIsSubmitting(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    setNewBody("");
    load();
  }

  async function handleSubmitReply(parentId: string) {
    if (!replyBody.trim()) return;
    setIsSubmitting(true);
    const result = await createCommentAction(postId, null, {
      body: replyBody,
      parentCommentId: parentId,
    });
    setIsSubmitting(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    setReplyBody("");
    setReplyingTo(null);
    load();
  }

  if (!comments) {
    return <p className="px-1 text-sm text-muted-foreground">...</p>;
  }

  const topLevel = comments.filter((c) => !c.parent_comment_id);
  const repliesByParent = new Map<string, CommentWithMeta[]>();
  for (const comment of comments) {
    if (comment.parent_comment_id) {
      const list = repliesByParent.get(comment.parent_comment_id) ?? [];
      list.push(comment);
      repliesByParent.set(comment.parent_comment_id, list);
    }
  }

  return (
    <div className="flex flex-col gap-3 border-t pt-3">
      {topLevel.length === 0 && (
        <p className="px-1 text-sm text-muted-foreground">{pt.feed.comments.empty}</p>
      )}

      {topLevel.map((comment) => (
        <div key={comment.id} className="flex flex-col gap-2">
          <CommentRow
            comment={comment}
            isReply={false}
            currentUserId={currentUserId}
            canModerate={canModerate}
            onReply={() => setReplyingTo(comment.id)}
            onChanged={load}
          />
          {(repliesByParent.get(comment.id) ?? []).map((reply) => (
            <CommentRow
              key={reply.id}
              comment={reply}
              isReply
              currentUserId={currentUserId}
              canModerate={canModerate}
              onChanged={load}
            />
          ))}
          {replyingTo === comment.id && (
            <div className="ml-9 flex gap-2">
              <Textarea
                rows={1}
                placeholder={pt.feed.comments.replyPlaceholder}
                value={replyBody}
                onChange={(event) => setReplyBody(event.target.value)}
              />
              <Button
                type="button"
                size="sm"
                disabled={isSubmitting}
                onClick={() => handleSubmitReply(comment.id)}
              >
                {pt.feed.comments.submit}
              </Button>
            </div>
          )}
        </div>
      ))}

      <div className="flex gap-2">
        <Textarea
          rows={1}
          placeholder={pt.feed.comments.placeholder}
          value={newBody}
          onChange={(event) => setNewBody(event.target.value)}
        />
        <Button type="button" size="sm" disabled={isSubmitting} onClick={handleSubmitTop}>
          {pt.feed.comments.submit}
        </Button>
      </div>
    </div>
  );
}
