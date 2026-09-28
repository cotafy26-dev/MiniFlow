"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { replyToTicketAction, updateTicketStatusAction } from "@/core/support/actions";
import type { SupportTicketMessageWithMeta, SupportTicketWithMeta } from "@/core/support/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";
import type { Database } from "@/types/database";

type TicketStatus = Database["public"]["Tables"]["support_tickets"]["Row"]["status"];

const STATUS_VARIANT: Record<TicketStatus, "default" | "secondary" | "outline"> = {
  open: "default",
  in_progress: "secondary",
  resolved: "outline",
  closed: "outline",
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function TicketThread({
  ticket,
  messages,
  canManageStatus,
  isTicketOwner,
}: {
  ticket: SupportTicketWithMeta;
  messages: SupportTicketMessageWithMeta[];
  canManageStatus: boolean;
  isTicketOwner: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  async function handleReply() {
    if (!body.trim()) return;
    setIsSubmitting(true);
    const result = await replyToTicketAction(ticket.id, body);
    setIsSubmitting(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    setBody("");
    router.refresh();
  }

  async function handleStatusChange(status: TicketStatus) {
    setIsChangingStatus(true);
    const result = await updateTicketStatusAction(ticket.id, status);
    setIsChangingStatus(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  const isClosed = ticket.status === "closed" || ticket.status === "resolved";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{ticket.subject}</h2>
          <p className="text-sm text-muted-foreground">{ticket.userName}</p>
        </div>

        {canManageStatus ? (
          <Select
            value={ticket.status}
            onValueChange={(value) => value && handleStatusChange(value as TicketStatus)}
            disabled={isChangingStatus}
          >
            <SelectTrigger className="w-40">
              <SelectValue>{pt.support.statusLabels[ticket.status]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(pt.support.statusLabels) as TicketStatus[]).map((status) => (
                <SelectItem key={status} value={status}>
                  {pt.support.statusLabels[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge variant={STATUS_VARIANT[ticket.status]}>{pt.support.statusLabels[ticket.status]}</Badge>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {messages.map((message) => (
          <div key={message.id} className={message.isStaff ? "flex gap-2" : "flex flex-row-reverse gap-2"}>
            <Avatar size="sm">
              <AvatarFallback>{initials(message.authorName)}</AvatarFallback>
            </Avatar>
            <div className="max-w-[80%] min-w-0">
              <div
                className={
                  message.isStaff
                    ? "rounded-lg bg-muted px-3 py-2"
                    : "rounded-lg bg-primary px-3 py-2 text-primary-foreground"
                }
              >
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{message.authorName}</p>
                  {message.isStaff && (
                    <Badge variant="secondary" className="text-[10px]">
                      {pt.support.staffBadge}
                    </Badge>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">{message.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!isClosed || canManageStatus ? (
        <div className="flex flex-col gap-2 border-t pt-3">
          <Textarea
            rows={3}
            placeholder={pt.support.replyPlaceholder}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
          <div className="flex justify-end gap-2">
            {isTicketOwner && !canManageStatus && (
              <Button
                type="button"
                variant="outline"
                onClick={() => handleStatusChange(isClosed ? "open" : "closed")}
                disabled={isChangingStatus}
              >
                {isClosed ? pt.support.reopenTicket : pt.support.closeTicket}
              </Button>
            )}
            <Button type="button" onClick={handleReply} disabled={isSubmitting || !body.trim()}>
              {isSubmitting ? pt.support.replying : pt.support.reply}
            </Button>
          </div>
        </div>
      ) : (
        isTicketOwner && (
          <div className="border-t pt-3">
            <Button type="button" variant="outline" onClick={() => handleStatusChange("open")}>
              {pt.support.reopenTicket}
            </Button>
          </div>
        )
      )}
    </div>
  );
}
