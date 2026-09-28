import { PERMISSIONS } from "@/core/permissions/constants";
import { requirePermission } from "@/core/permissions/guards";

export default async function AdminGamificationLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(PERMISSIONS.GAMIFICATION_MANAGE);
  return children;
}
