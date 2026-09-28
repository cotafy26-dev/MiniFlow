"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function ConfirmDeleteButton({
  confirmMessage,
  ariaLabel,
  onDelete,
}: {
  confirmMessage: string;
  ariaLabel: string;
  onDelete: () => Promise<{ error?: string }>;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleClick() {
    if (!window.confirm(confirmMessage)) return;
    setIsDeleting(true);
    const result = await onDelete();
    setIsDeleting(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={isDeleting}
      onClick={handleClick}
      aria-label={ariaLabel}
    >
      <Trash2 className="size-4 text-destructive" />
    </Button>
  );
}
