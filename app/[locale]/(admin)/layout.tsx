import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminPendingCounts } from "@/lib/queries/admin";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type Props = {
  children: React.ReactNode;
};

export default async function AdminLayout({ children }: Props) {
  const counts = await getAdminPendingCounts();

  return <AdminShell counts={counts}>{children}</AdminShell>;
}
