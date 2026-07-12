import { AdminHeader } from "./admin-header";
import { AdminSidebar } from "./admin-sidebar";
import type { AdminPendingCounts } from "@/lib/queries/admin";

type Props = {
  counts: AdminPendingCounts;
  children: React.ReactNode;
};

export function AdminShell({ counts, children }: Props) {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar counts={counts} />
      <div className="flex min-w-0 flex-1 flex-col lg:ml-0">
        <AdminHeader />
        <div className="flex-1 px-4 py-6 pt-16 lg:px-8 lg:py-8 lg:pt-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </div>
      </div>
    </div>
  );
}
