import type { Metadata } from "next";

import { TicketQueue } from "@/components/admin/ticket-queue";
import { requireTenantContext } from "@/core/permissions/guards";
import { getTicketsForAdmin } from "@/core/support/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.support.adminTitle };

export default async function AdminSupportPage() {
  const ctx = await requireTenantContext();
  const tickets = ctx.tenant ? await getTicketsForAdmin(ctx.tenant.id) : [];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold">{pt.support.adminTitle}</h2>
        <p className="text-sm text-muted-foreground">{pt.support.adminSubtitle}</p>
      </div>

      <TicketQueue tickets={tickets} />
    </div>
  );
}
