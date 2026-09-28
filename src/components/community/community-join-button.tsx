"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { joinCommunityAction, leaveCommunityAction } from "@/core/communities/actions";
import { pt } from "@/lib/i18n/dictionaries/pt";

export function CommunityJoinButton({
  communityId,
  slug,
  isMember,
}: {
  communityId: string;
  slug: string;
  isMember: boolean;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    if (isMember && !window.confirm(pt.community.detail.leaveConfirm)) return;
    setIsSubmitting(true);
    const result = isMember
      ? await leaveCommunityAction(communityId, slug)
      : await joinCommunityAction(communityId, slug);
    setIsSubmitting(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <Button variant={isMember ? "outline" : "default"} disabled={isSubmitting} onClick={handleClick}>
      {isMember ? pt.community.detail.leaveButton : pt.community.detail.joinButton}
    </Button>
  );
}
