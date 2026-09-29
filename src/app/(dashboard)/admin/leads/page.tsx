import type { Metadata } from "next";

import { getPlatformLeadsForAdmin } from "@/core/leads/queries";
import { requireSuperAdmin } from "@/core/permissions/guards";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.leads.title };

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default async function AdminLeadsPage() {
  await requireSuperAdmin();
  const leads = await getPlatformLeadsForAdmin();

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold">{pt.leads.title}</h2>
        <p className="text-sm text-muted-foreground">{pt.leads.subtitle}</p>
      </div>

      {leads.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          {pt.leads.empty}
        </div>
      ) : (
        <div className="flex flex-col divide-y rounded-xl border">
          {leads.map((lead) => (
            <div key={lead.id} className="flex flex-col gap-1 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{lead.name}</p>
                <span className="text-xs text-muted-foreground">{formatDate(lead.created_at)}</span>
              </div>
              <p className="text-sm text-muted-foreground">{lead.email}</p>
              <p className="text-sm text-muted-foreground">
                {pt.leads.whatsapp}: {lead.whatsapp}
              </p>
              {lead.message && (
                <p className="mt-1 text-sm">
                  {pt.leads.message}: {lead.message}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
