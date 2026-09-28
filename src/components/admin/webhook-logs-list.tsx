import { Badge } from "@/components/ui/badge";
import type { WebhookLog } from "@/core/integrations/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";

const statusVariant = {
  processed: "default",
  ignored: "secondary",
  error: "destructive",
} as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function WebhookLogsList({ logs }: { logs: WebhookLog[] }) {
  if (logs.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        {pt.integrations.hotmart.logsEmpty}
      </p>
    );
  }

  return (
    <div className="flex flex-col divide-y rounded-xl border">
      {logs.map((log) => (
        <details key={log.id} className="p-3">
          <summary className="flex cursor-pointer items-center gap-3 text-sm">
            <Badge variant={statusVariant[log.status]}>{pt.integrations.hotmart.statusLabels[log.status]}</Badge>
            <span className="font-medium">{log.event_type ?? "—"}</span>
            <span className="text-muted-foreground">{formatDate(log.created_at)}</span>
          </summary>
          <div className="mt-2 flex flex-col gap-2 pl-1 text-sm">
            {log.error_message && <p className="text-destructive">{log.error_message}</p>}
            <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
              {JSON.stringify(log.payload, null, 2)}
            </pre>
          </div>
        </details>
      ))}
    </div>
  );
}
