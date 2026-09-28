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
import { grantProductAccessAction, revokeProductAccessAction } from "@/core/products/actions";
import type { ProductAccessGrant } from "@/core/products/queries";
import type { TenantMember } from "@/core/users/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";

export function ProductAccessManager({
  productId,
  grants,
  members,
}: {
  productId: string;
  grants: ProductAccessGrant[];
  members: TenantMember[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const grantedUserIds = new Set(grants.map((g) => g.userId));
  const availableMembers = members.filter((m) => !grantedUserIds.has(m.userId));

  async function handleGrant() {
    if (!selectedUserId) return;
    setIsSubmitting(true);
    const result = await grantProductAccessAction(productId, selectedUserId);
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
    const result = await revokeProductAccessAction(productId, userId);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{pt.products.access.title}</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="size-4" />
            {pt.products.access.grant}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{pt.products.access.grant}</DialogTitle>
            </DialogHeader>
            <Select value={selectedUserId} onValueChange={(value) => setSelectedUserId(value ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={pt.products.access.selectMember} />
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
              <Button type="button" disabled={!selectedUserId || isSubmitting} onClick={handleGrant}>
                {pt.products.access.grant}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {grants.length === 0 ? (
        <p className="text-sm text-muted-foreground">{pt.products.access.empty}</p>
      ) : (
        <div className="flex flex-col divide-y rounded-xl border">
          {grants.map((grant) => (
            <div key={grant.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{grant.fullName}</p>
                <p className="truncate text-xs text-muted-foreground">{grant.email}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => handleRevoke(grant.userId)}
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
