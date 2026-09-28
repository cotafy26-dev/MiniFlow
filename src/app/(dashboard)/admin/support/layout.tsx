import { PERMISSIONS } from "@/core/permissions/constants";
import { requirePermission } from "@/core/permissions/guards";

export default async function AdminSupportLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(PERMISSIONS.SUPPORT_MANAGE);
  return children;
}
