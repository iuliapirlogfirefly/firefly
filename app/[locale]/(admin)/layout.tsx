import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminPendingCounts } from "@/lib/queries/admin";

type Props = {
  children: React.ReactNode;
};

export default async function AdminLayout({ children }: Props) {
  const counts = await getAdminPendingCounts();

  return <AdminShell counts={counts}>{children}</AdminShell>;
}
