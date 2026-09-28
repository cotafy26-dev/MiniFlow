"use client";

import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { awardBadgeManuallyAction, revokeBadgeAction } from "@/core/gamification/actions";
import type { TenantMember } from "@/core/users/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";

export interface BadgeMemberAward {
  userId: string;
  fullName: string;
  email: string;
}

export function BadgeMemberManager({
  badgeId,
  awards,
  members,
}: {
  badgeId: string;
  awards: BadgeMemberAward[];
  members: TenantMember[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const awardedUserIds = new Set(awards.map((a) => a.userId));
  const availableMembers = members.filter((m) => !awardedUserIds.has(m.userId));

  async function handleAward() {
    if (!selectedUserId) return;
    setIsSubmitting(true);
    const result = await awardBadgeManuallyAction(badgeId, selectedUserId);
    setIsSubmitting(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    setOpen(false);
    setSelectedUserId("");
    router.refresh();
  }

  async function handleRevoke(userId: string) {
    const result = await revokeBadgeAction(badgeId, userId);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{pt.gamification.badges.membersTitle}</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="size-4" />
            {pt.gamification.badges.award}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{pt.gamification.badges.award}</DialogTitle>
            </DialogHeader>
            <Select value={selectedUserId} onValueChange={(value) => setSelectedUserId(value ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={pt.gamification.badges.selectMember} />
              </SelectTrigger>
              <SelectContent>
                {availableMembers.map((member) => (
                  <SelectItem key={member.userId} value={member.userId}>
                    {member.fullName} ({member.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button type="button" disabled={!selectedUserId || isSubmitting} onClick={handleAward}>
                {pt.gamification.badges.award}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {awards.length === 0 ? (
        <p className="text-sm text-muted-foreground">{pt.gamification.badges.membersEmpty}</p>
      ) : (
        <div className="flex flex-col divide-y rounded-xl border">
          {awards.map((award) => (
            <div key={award.userId} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{award.fullName}</p>
                <p className="truncate text-xs text-muted-foreground">{award.email}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={pt.gamification.badges.revoke}
                onClick={() => handleRevoke(award.userId)}
              >
                <X className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
