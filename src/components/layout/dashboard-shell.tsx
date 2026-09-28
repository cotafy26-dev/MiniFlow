import { BottomNav } from "@/components/layout/bottom-nav";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Topbar } from "@/components/layout/topbar";

export function DashboardShell({
  fullName,
  email,
  tenantName,
  canManageAdmin,
  children,
}: {
  fullName: string;
  email: string;
  tenantName: string | null;
  canManageAdmin: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh">
      <SidebarNav />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar fullName={fullName} email={email} tenantName={tenantName} canManageAdmin={canManageAdmin} />
        <main className="flex-1 p-4 pb-20 md:p-6 md:pb-6">{children}</main>
      </div>

      <BottomNav />
    </div>
  );
}
