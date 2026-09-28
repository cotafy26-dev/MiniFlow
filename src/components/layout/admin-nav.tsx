"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ADMIN_NAV_ITEMS } from "@/core/navigation/admin-nav-items";
import { cn } from "@/lib/utils";

/**
 * Second-level nav inside /admin — without it, each section (Mini Apps,
 * Produtos, Comunidade, Gamificação, Integrações) is only reachable by
 * typing its URL directly, since /admin itself redirects straight to
 * whichever section comes first for the visitor's permissions.
 *
 * Receives only the visible items' keys (not the full item objects, which
 * carry a LucideIcon component reference) — icons are resolved from
 * ADMIN_NAV_ITEMS here, inside the client bundle, the same way
 * SidebarNav imports NAV_ITEMS directly instead of taking it as a prop.
 */
export function AdminNav({ visibleKeys }: { visibleKeys: string[] }) {
  const pathname = usePathname();
  const items = ADMIN_NAV_ITEMS.filter((item) => visibleKeys.includes(item.key));

  if (items.length <= 1) return null;

  return (
    <nav className="flex flex-wrap gap-2 border-b pb-4">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
