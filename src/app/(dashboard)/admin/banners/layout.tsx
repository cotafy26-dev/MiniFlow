import { PERMISSIONS } from "@/core/permissions/constants";
import { requirePermission } from "@/core/permissions/guards";

export default async function AdminBannersLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(PERMISSIONS.BANNERS_MANAGE);
  return children;
}
