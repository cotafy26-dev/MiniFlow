import { PERMISSIONS } from "@/core/permissions/constants";
import { requirePermission } from "@/core/permissions/guards";

export default async function AdminProductsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);
  return children;
}
