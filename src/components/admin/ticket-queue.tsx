"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SupportTicketWithMeta } from "@/core/support/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";
import type { Database } from "@/types/database";

type TicketStatus = Database["public"]["Tables"]["support_tickets"]["Row"]["status"];

const STATUS_VARIANT: Record<TicketStatus, "default" | "secondary" | "outline"> = {
  open: "default",
  in_progress: "secondary",
  resolved: "outline",
  closed: "outline",
};

export function TicketQueue({ tickets }: { tickets: SupportTicketWithMeta[] }) {
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");

  const filtered = useMemo(() => {
    if (statusFilter === "all") return tickets;
    return tickets.filter((ticket) => ticket.status === statusFilter);
  }, [tickets, statusFilter]);

  return (
    <div className="flex flex-col gap-4">
      <Select value={statusFilter} onValueChange={(value) => value && setStatusFilter(value as TicketStatus | "all")}>
        <SelectTrigger className="w-44">
          <SelectValue>
            {statusFilter === "all" ? pt.support.filterAll : pt.support.statusLabels[statusFilter]}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{pt.support.filterAll}</SelectItem>
          {(Object.keys(pt.support.statusLabels) as TicketStatus[]).map((status) => (
            <SelectItem key={status} value={status}>
              {pt.support.statusLabels[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          {pt.support.emptyAdmin}
        </div>
      ) : (
        <div className="flex flex-col divide-y rounded-xl border">
          {filtered.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/admin/support/${ticket.id}`}
              className="flex items-center gap-3 p-3 hover:bg-muted"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{ticket.subject}</p>
                <p className="truncate text-xs text-muted-foreground">{ticket.userName}</p>
              </div>
              <Badge variant={STATUS_VARIANT[ticket.status]}>{pt.support.statusLabels[ticket.status]}</Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
