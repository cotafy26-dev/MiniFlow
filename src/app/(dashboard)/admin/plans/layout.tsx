import { PERMISSIONS } from "@/core/permissions/constants";
import { requirePermission } from "@/core/permissions/guards";

export default async function AdminPlansLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(PERMISSIONS.TENANT_SETTINGS_MANAGE);
  return children;
}
