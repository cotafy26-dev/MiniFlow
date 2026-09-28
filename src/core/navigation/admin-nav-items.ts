import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CreditCard,
  GalleryHorizontal,
  GraduationCap,
  Grid2X2,
  LifeBuoy,
  Mail,
  Plug,
  Trophy,
  UserCog,
  Users,
} from "lucide-react";

import { PERMISSIONS, type PermissionKey } from "@/core/permissions/constants";
import { pt } from "@/lib/i18n/dictionaries/pt";

export interface AdminNavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Any one of these grants visibility (OR, not AND) — matches the same
   * permission set each section's own layout.tsx already guards with. */
  permissions: PermissionKey[];
}

/**
 * Single source of truth for the admin sub-navigation, rendered by
 * AdminNav (src/components/layout/admin-nav.tsx). Each new admin section
 * appends its own entry here instead of leaving itself reachable only by
 * typing its URL directly — the gap that made every phase's admin work
 * invisible until now.
 */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    key: "members",
    label: pt.admin.sections.members,
    href: "/admin/members",
    icon: UserCog,
    permissions: [PERMISSIONS.MEMBERS_VIEW, PERMISSIONS.MEMBERS_MANAGE],
  },
  {
    key: "apps",
    label: pt.admin.sections.apps,
    href: "/admin/apps",
    icon: Grid2X2,
    permissions: [PERMISSIONS.APPS_MANAGE],
  },
  {
    key: "products",
    label: pt.admin.sections.products,
    href: "/admin/products",
    icon: GraduationCap,
    permissions: [PERMISSIONS.PRODUCTS_MANAGE],
  },
  {
    key: "community",
    label: pt.admin.sections.community,
    href: "/admin/community",
    icon: Users,
    permissions: [PERMISSIONS.COMMUNITY_MANAGE, PERMISSIONS.COMMUNITY_MODERATE],
  },
  {
    key: "gamification",
    label: pt.admin.sections.gamification,
    href: "/admin/gamification",
    icon: Trophy,
    permissions: [PERMISSIONS.GAMIFICATION_MANAGE],
  },
  {
    key: "integrations",
    label: pt.admin.sections.integrations,
    href: "/admin/integrations",
    icon: Plug,
    permissions: [PERMISSIONS.INTEGRATIONS_MANAGE],
  },
  {
    key: "support",
    label: pt.admin.sections.support,
    href: "/admin/support",
    icon: LifeBuoy,
    permissions: [PERMISSIONS.SUPPORT_MANAGE],
  },
  {
    key: "banners",
    label: pt.admin.sections.banners,
    href: "/admin/banners",
    icon: GalleryHorizontal,
    permissions: [PERMISSIONS.BANNERS_MANAGE],
  },
  {
    key: "emails",
    label: pt.admin.sections.emails,
    href: "/admin/emails",
    icon: Mail,
    permissions: [PERMISSIONS.TENANT_SETTINGS_MANAGE],
  },
  {
    key: "plans",
    label: pt.admin.sections.plans,
    href: "/admin/plans",
    icon: CreditCard,
    permissions: [PERMISSIONS.TENANT_SETTINGS_MANAGE],
  },
  {
    key: "analytics",
    label: pt.admin.sections.analytics,
    href: "/admin/analytics",
    icon: BarChart3,
    permissions: [PERMISSIONS.ACTIVITY_LOGS_VIEW],
  },
];
