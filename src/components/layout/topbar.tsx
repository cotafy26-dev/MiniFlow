import { LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { PushNotificationToggle } from "@/components/layout/push-notification-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { pt } from "@/lib/i18n/dictionaries/pt";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function Topbar({
  fullName,
  email,
  tenantName,
  canManageAdmin,
}: {
  fullName: string;
  email: string;
  tenantName: string | null;
  canManageAdmin: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60 md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <BrandMark size={26} />
        <span className="font-semibold tracking-tight">{pt.app.name}</span>
      </div>

      {tenantName && (
        <span className="hidden truncate text-sm text-muted-foreground md:block">{tenantName}</span>
      )}

      <div className="ml-auto flex items-center gap-1">
        <PushNotificationToggle />
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <Avatar>
              <AvatarFallback>{initials(fullName)}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex flex-col gap-0.5 px-2 py-1.5">
                <span className="text-sm font-medium text-foreground">{fullName}</span>
                <span className="truncate text-xs text-muted-foreground">{email}</span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            {canManageAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/admin" />}>
                  <ShieldCheck className="size-4" />
                  {pt.admin.navLink}
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            {/* Plain form (not a DropdownMenuItem) so sign-out stays a real
                POST to /auth/signout and works without client JS — Base UI's
                Menu.Item has no asChild equivalent that composes cleanly with
                a <form>. Classes mirror DropdownMenuItem's own styling. */}
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="flex w-full cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-sm text-destructive outline-hidden select-none hover:bg-destructive/10 focus-visible:bg-destructive/10"
              >
                <LogOut className="size-4" />
                {pt.dashboard.signOut}
              </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
