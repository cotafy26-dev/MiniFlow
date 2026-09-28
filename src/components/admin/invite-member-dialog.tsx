"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createInvitationAction } from "@/core/invitations/actions";
import type { Role } from "@/core/users/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";
import { inviteSchema, type InviteValues } from "@/lib/validations/invitations";

export function InviteMemberDialog({ roles }: { roles: Role[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteValues>({ resolver: zodResolver(inviteSchema) });

  async function onSubmit(values: InviteValues) {
    setFormError(null);
    const result = await createInvitationAction(values.email, values.roleId);
    if (result?.error) {
      setFormError(result.error);
      return;
    }
    reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <UserPlus className="size-4" />
        {pt.members.inviteButton}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{pt.members.inviteDialogTitle}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="invite-email">{pt.members.emailLabel}</FieldLabel>
            <Input id="invite-email" type="email" {...register("email")} />
            <FieldError errors={[errors.email]} />
          </Field>

          <Field>
            <FieldLabel>{pt.members.roleLabel}</FieldLabel>
            <Controller
              name="roleId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.roleId]} />
          </Field>

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <Button type="submit" disabled={isSubmitting} className="w-fit">
            {isSubmitting ? pt.members.inviteSubmitting : pt.members.inviteSubmit}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
