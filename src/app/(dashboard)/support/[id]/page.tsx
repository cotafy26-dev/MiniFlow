import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { TicketThread } from "@/components/support/ticket-thread";
import { requireTenantContext } from "@/core/permissions/guards";
import { getTicketById, getTicketMessages } from "@/core/support/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const ticket = await getTicketById(id);
  return { title: ticket?.subject ?? pt.support.title };
}

export default async function SupportTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireTenantContext();

  const ticket = await getTicketById(id);
  // RLS already scopes support_tickets to staff-or-owner — a member who
  // isn't support.manage and isn't the ticket's own opener gets no row
  // back at all, so this reads the same as "not found" either way.
  if (!ticket || ticket.user_id !== ctx.userId) notFound();
  const messages = await getTicketMessages(id);

  return (
    <div className="flex flex-col gap-4">
      <Link href="/support" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        {pt.support.backToList}
      </Link>

      <TicketThread ticket={ticket} messages={messages} canManageStatus={false} isTicketOwner />
    </div>
  );
}
