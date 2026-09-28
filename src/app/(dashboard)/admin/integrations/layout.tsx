import { PERMISSIONS } from "@/core/permissions/constants";
import { requirePermission } from "@/core/permissions/guards";

export default async function AdminIntegrationsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(PERMISSIONS.INTEGRATIONS_MANAGE);
  return children;
}
