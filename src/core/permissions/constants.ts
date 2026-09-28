/**
 * Mirrors the permission/role keys seeded by
 * supabase/migrations/0004_roles_permissions.sql,
 * 0010_apps_permission_seed.sql, 0014_products_permission_seed.sql,
 * 0021_feed_community_permission_seed.sql,
 * 0028_integrations_permission_seed.sql,
 * 0032_gamification_permission_seed.sql,
 * 0038_support_permission_seed.sql and
 * 0040_banners_permission_seed.sql. Keep in sync by hand — these
 * are UI-facing constants (labels, guard checks), not a source of truth
 * for the database itself.
 */

export const PERMISSIONS = {
  TENANT_SETTINGS_MANAGE: "tenant.settings.manage",
  MEMBERS_VIEW: "members.view",
  MEMBERS_MANAGE: "members.manage",
  ACTIVITY_LOGS_VIEW: "activity_logs.view",
  COMMUNITY_MODERATE: "community.moderate",
  APPS_MANAGE: "apps.manage",
  PRODUCTS_MANAGE: "products.manage",
  FEED_PUBLISH: "feed.publish",
  COMMUNITY_MANAGE: "community.manage",
  INTEGRATIONS_MANAGE: "integrations.manage",
  GAMIFICATION_MANAGE: "gamification.manage",
  SUPPORT_MANAGE: "support.manage",
  BANNERS_MANAGE: "banners.manage",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_KEYS = {
  ADMIN: "admin",
  MODERATOR: "moderator",
  MEMBER: "member",
} as const;

export type RoleKey = (typeof ROLE_KEYS)[keyof typeof ROLE_KEYS];

export const ROLE_LABELS: Record<RoleKey, string> = {
  admin: "Administrador",
  moderator: "Moderador",
  member: "Aluno/Membro",
};
