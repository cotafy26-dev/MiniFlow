"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "@/core/navigation/nav-items";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.showInBottomNav);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-14 items-center justify-around border-t bg-background md:hidden">
      {items.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-1.5 text-xs font-medium",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="size-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
