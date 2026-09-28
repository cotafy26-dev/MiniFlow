import type { LucideIcon } from "lucide-react";
import { Grid2X2, LayoutGrid, LifeBuoy, Rss, Trophy, Users } from "lucide-react";

import { pt } from "@/lib/i18n/dictionaries/pt";

export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Shown in the mobile bottom nav (kept short — max ~5 items fit). */
  showInBottomNav?: boolean;
}

/**
 * Single source of truth for Sidebar (desktop) and BottomNav (mobile).
 * Fase 1 only ships /dashboard — Fase 2+ modules and mini-apps append their
 * own entries here (e.g. "Meus Apps" -> /apps, "Comunidade" -> /community)
 * instead of editing either nav component directly.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutGrid,
    showInBottomNav: true,
  },
  {
    key: "apps",
    label: pt.nav.apps,
    href: "/apps",
    icon: Grid2X2,
    showInBottomNav: true,
  },
  {
    key: "feed",
    label: pt.nav.feed,
    href: "/feed",
    icon: Rss,
    showInBottomNav: true,
  },
  {
    key: "community",
    label: pt.nav.community,
    href: "/community",
    icon: Users,
    showInBottomNav: true,
  },
  {
    key: "ranking",
    label: pt.nav.ranking,
    href: "/ranking",
    icon: Trophy,
    // Not in the bottom nav — Dashboard/Apps/Feed/Comunidade already fill
    // it (see the ~5-item guidance in this file's own comment above).
    showInBottomNav: false,
  },
  {
    key: "support",
    label: pt.nav.support,
    href: "/support",
    icon: LifeBuoy,
    showInBottomNav: false,
  },
];
