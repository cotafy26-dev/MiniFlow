"use client";

import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
import {
  addMemberAction,
  banMemberAction,
  removeMemberAction,
  setMemberRoleAction,
  unbanMemberAction,
} from "@/core/communities/actions";
import type { CommunityMemberWithProfile } from "@/core/communities/queries";
import type { TenantMember } from "@/core/users/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";
import { communityMemberRoleValues } from "@/lib/validations/communities";

export function CommunityMemberManager({
  communityId,
  members,
  tenantMembers,
}: {
  communityId: string;
  members: CommunityMemberWithProfile[];
  tenantMembers: TenantMember[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const memberUserIds = new Set(members.map((m) => m.user_id));
  const availableMembers = tenantMembers.filter((m) => !memberUserIds.has(m.userId));

  async function handleAdd() {
    if (!selectedUserId) return;
    setIsSubmitting(true);
    const result = await addMemberAction(communityId, selectedUserId);
    setIsSubmitting(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    setOpen(false);
    setSelectedUserId("");
    router.refresh();
  }

  async function handleRemove(userId: string) {
    const result = await removeMemberAction(communityId, userId);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  async function handleToggleBan(userId: string, banned: boolean) {
    const result = banned
      ? await unbanMemberAction(communityId, userId)
      : await banMemberAction(communityId, userId);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  async function handleRoleChange(userId: string, role: (typeof communityMemberRoleValues)[number]) {
    const result = await setMemberRoleAction(communityId, userId, { role });
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{pt.community.admin.members.title}</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="size-4" />
            {pt.community.admin.members.add}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{pt.community.admin.members.add}</DialogTitle>
            </DialogHeader>
            <Select value={selectedUserId} onValueChange={(value) => setSelectedUserId(value ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={pt.community.admin.members.selectMember} />
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
              <Button type="button" disabled={!selectedUserId || isSubmitting} onClick={handleAdd}>
                {pt.community.admin.members.add}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground">{pt.community.admin.members.empty}</p>
      ) : (
        <div className="flex flex-col divide-y rounded-xl border">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{member.fullName}</p>
                  {member.status === "banned" && (
                    <Badge variant="outline">{pt.community.admin.members.banned}</Badge>
                  )}
                </div>
              </div>

              <Select
                value={member.role}
                onValueChange={(value) =>
                  handleRoleChange(member.user_id, value as (typeof communityMemberRoleValues)[number])
                }
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {communityMemberRoleValues.map((role) => (
                    <SelectItem key={role} value={role}>
                      {pt.community.detail.roleBadges[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleToggleBan(member.user_id, member.status === "banned")}
              >
                {member.status === "banned"
                  ? pt.community.admin.members.unban
                  : pt.community.admin.members.ban}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={pt.community.admin.members.remove}
                onClick={() => handleRemove(member.user_id)}
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
