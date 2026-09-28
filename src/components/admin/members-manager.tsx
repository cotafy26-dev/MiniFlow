"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  changeMemberRoleAction,
  reactivateMemberAction,
  removeMemberAction,
  suspendMemberAction,
} from "@/core/users/actions";
import type { Role, TenantMemberFull } from "@/core/users/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";

const statusVariant = {
  active: "default",
  invited: "secondary",
  suspended: "destructive",
} as const;

export function MembersManager({
  members,
  roles,
  canManage,
}: {
  members: TenantMemberFull[];
  roles: Role[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (member) =>
        member.fullName.toLowerCase().includes(q) || member.email.toLowerCase().includes(q)
    );
  }, [members, search]);

  async function run(action: () => Promise<{ error?: string }>) {
    const result = await action();
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  function handleRemove(membershipId: string) {
    if (!window.confirm(pt.members.removeConfirm)) return;
    run(() => removeMemberAction(membershipId));
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder={pt.members.searchPlaceholder}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="max-w-sm"
      />

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          {pt.members.empty}
        </div>
      ) : (
        <div className="flex flex-col divide-y rounded-xl border">
          {filtered.map((member) => (
            <div key={member.membershipId} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{member.fullName}</p>
                  {member.isTenantOwner && <Badge variant="outline">{pt.members.owner}</Badge>}
                  <Badge variant={statusVariant[member.status]}>{pt.members.status[member.status]}</Badge>
                </div>
                <p className="truncate text-xs text-muted-foreground">{member.email}</p>
              </div>

              <Select
                value={member.roleId}
                onValueChange={(value) => value && run(() => changeMemberRoleAction(member.membershipId, value))}
                disabled={!canManage || member.isTenantOwner}
              >
                <SelectTrigger className="w-36">
                  <SelectValue>{member.roleName}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {canManage && !member.isTenantOwner && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      run(() =>
                        member.status === "suspended"
                          ? reactivateMemberAction(member.membershipId)
                          : suspendMemberAction(member.membershipId)
                      )
                    }
                  >
                    {member.status === "suspended" ? pt.members.reactivate : pt.members.suspend}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => handleRemove(member.membershipId)}
                  >
                    {pt.members.remove}
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">{pt.members.ownerHint}</p>
    </div>
  );
}
