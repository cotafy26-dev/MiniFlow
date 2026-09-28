"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import { NAV_ITEMS } from "@/core/navigation/nav-items";
import { cn } from "@/lib/utils";
import { pt } from "@/lib/i18n/dictionaries/pt";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 border-r bg-background md:flex md:flex-col">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <BrandMark size={26} />
        <span className="font-semibold tracking-tight">{pt.app.name}</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
