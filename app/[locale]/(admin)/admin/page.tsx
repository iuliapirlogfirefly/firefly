import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getAdminAnalytics } from "@/lib/queries/analytics";
import { getAdminPendingCounts } from "@/lib/queries/admin";
import { getUnreadContactNotifications } from "@/lib/queries/contact";
import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export default async function AdminDashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [analytics, counts, unreadMessages] = await Promise.all([
    getAdminAnalytics(),
    getAdminPendingCounts(),
    getUnreadContactNotifications(5),
  ]);

  return (
    <AdminDashboard
      analytics={analytics}
      counts={counts}
      unreadMessages={unreadMessages}
    />
  );
}
