import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireTenantContext } from "@/core/permissions/guards";
import { getMyTickets } from "@/core/support/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";
import type { Database } from "@/types/database";

type TicketStatus = Database["public"]["Tables"]["support_tickets"]["Row"]["status"];

const STATUS_VARIANT: Record<TicketStatus, "default" | "secondary" | "outline"> = {
  open: "default",
  in_progress: "secondary",
  resolved: "outline",
  closed: "outline",
};

export const metadata: Metadata = { title: pt.support.title };

export default async function SupportPage() {
  const ctx = await requireTenantContext();
  const tickets = ctx.tenant ? await getMyTickets(ctx.tenant.id, ctx.userId) : [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{pt.support.title}</h2>
          <p className="text-sm text-muted-foreground">{pt.support.subtitle}</p>
        </div>
        <Button render={<Link href="/support/new" />}>
          <Plus className="size-4" />
          {pt.support.newTicket}
        </Button>
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          {pt.support.empty}
        </div>
      ) : (
        <div className="flex flex-col divide-y rounded-xl border">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/support/${ticket.id}`}
              className="flex items-center gap-3 p-3 hover:bg-muted"
            >
              <p className="min-w-0 flex-1 truncate text-sm font-medium">{ticket.subject}</p>
              <Badge variant={STATUS_VARIANT[ticket.status]}>{pt.support.statusLabels[ticket.status]}</Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
