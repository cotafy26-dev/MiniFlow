"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { setLessonProgressAction } from "@/core/products/actions";
import { pt } from "@/lib/i18n/dictionaries/pt";

export function LessonCompleteToggle({
  lessonId,
  initiallyCompleted,
}: {
  lessonId: string;
  initiallyCompleted: boolean;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initiallyCompleted);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    setIsSubmitting(true);
    const result = await setLessonProgressAction(lessonId, !completed);
    setIsSubmitting(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    setCompleted((prev) => !prev);
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant={completed ? "secondary" : "default"}
      disabled={isSubmitting}
      onClick={handleClick}
      className="w-fit"
    >
      <Check className="size-4" />
      {completed ? pt.products.detail.markIncomplete : pt.products.detail.markComplete}
    </Button>
  );
}
