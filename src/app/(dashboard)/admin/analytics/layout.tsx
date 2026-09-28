import { PERMISSIONS } from "@/core/permissions/constants";
import { requirePermission } from "@/core/permissions/guards";

export default async function AdminAnalyticsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(PERMISSIONS.ACTIVITY_LOGS_VIEW);
  return children;
}
