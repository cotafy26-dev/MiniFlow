import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { NewTicketForm } from "@/components/support/new-ticket-form";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.support.newTicket };

export default function NewSupportTicketPage() {
  return (
    <div className="flex flex-col gap-4">
      <Link href="/support" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        {pt.support.backToList}
      </Link>

      <h2 className="text-lg font-semibold">{pt.support.newTicket}</h2>
      <NewTicketForm />
    </div>
  );
}
