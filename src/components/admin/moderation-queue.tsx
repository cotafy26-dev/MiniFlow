"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dismissReportAction, resolveReportAction } from "@/core/posts/actions";
import type { ModerationReportItem } from "@/core/communities/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";

export function ModerationQueue({ reports }: { reports: ModerationReportItem[] }) {
  const router = useRouter();

  async function handle(action: (id: string) => Promise<{ error?: string }>, id: string) {
    const result = await action(id);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
        {pt.community.moderation.openReportsEmpty}
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y rounded-xl border">
      {reports.map((report) => (
        <div key={report.id} className="flex flex-col gap-2 p-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{report.targetType === "post" ? "Post" : "Comentário"}</Badge>
            <span className="text-xs text-muted-foreground">
              {pt.community.moderation.reportedBy} {report.reporterName}
            </span>
          </div>
          <p className="line-clamp-3 text-sm text-muted-foreground">{report.preview}</p>
          <p className="text-sm">
            <span className="font-medium">{pt.community.moderation.reasonLabel}:</span> {report.reason}
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handle(resolveReportAction, report.id)}>
              {pt.community.moderation.resolveButton}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handle(dismissReportAction, report.id)}
            >
              {pt.community.moderation.dismissButton}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
