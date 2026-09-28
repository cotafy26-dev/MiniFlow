"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { createReportAction } from "@/core/posts/actions";
import { pt } from "@/lib/i18n/dictionaries/pt";

export function ReportDialog({
  open,
  onOpenChange,
  targetType,
  targetId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: "post" | "comment";
  targetId: string;
}) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (reason.trim().length < 3) return;
    setIsSubmitting(true);
    const result = await createReportAction({ targetType, targetId, reason });
    setIsSubmitting(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(pt.report.success);
    setReason("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{pt.report.dialogTitle}</DialogTitle>
        </DialogHeader>
        <Textarea
          rows={4}
          placeholder={pt.report.reasonPlaceholder}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
        <DialogFooter>
          <Button type="button" disabled={reason.trim().length < 3 || isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? pt.report.submitting : pt.report.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
