import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getAdminAnalytics } from "@/lib/queries/analytics";
import { getAdminPendingCounts } from "@/lib/queries/admin";
import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export default async function AdminDashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [analytics, counts] = await Promise.all([
    getAdminAnalytics(),
    getAdminPendingCounts(),
  ]);

  return <AdminDashboard analytics={analytics} counts={counts} />;
}
