import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminStatCard } from "@/components/admin/ui/admin-stat-card";
import type { AdminAnalytics } from "@/lib/queries/analytics";
import type { AdminPendingCounts } from "@/lib/queries/admin";
import { formatMoney } from "@/lib/utils/money";

type UnreadNotification = {
  id: string;
  businessName: string;
  subject: string;
  createdAt: string;
};

type Props = {
  analytics: AdminAnalytics;
  counts: AdminPendingCounts;
  unreadMessages: UnreadNotification[];
};

function productKey(key: string) {
  if (key === "subscription" || key === "premium_monthly") return "premium";
  return key;
}

export async function AdminDashboard({
  analytics,
  counts,
  unreadMessages,
}: Props) {
  const t = await getTranslations("admin");
  const tMetrics = await getTranslations("common.metrics");
  const tProducts = await getTranslations("common.products");

  const hasPending =
    counts.pendingEvents > 0 ||
    counts.pendingPosts > 0 ||
    counts.pendingBusinesses > 0 ||
    counts.unreadMessages > 0;

  return (
    <div data-route="admin-dashboard">
      <h1 className="font-heading text-2xl font-semibold text-foreground md:text-3xl">
        {t("overview")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("overviewSubtitle")}
      </p>

      {unreadMessages.length > 0 ? (
        <div className="mt-6 space-y-3">
          <h2 className="text-sm font-medium text-foreground">
            {t("supportNotifications")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {unreadMessages.map((message) => (
              <Link key={message.id} href="/admin/messages">
                <AdminCard className="border-amber-500/30 p-4 transition-colors hover:bg-surface-2">
                  <p className="text-sm font-medium text-amber-400">
                    {t("messageAlert", { businessName: message.businessName })}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {message.subject}
                  </p>
                </AdminCard>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {hasPending ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {counts.pendingEvents > 0 ? (
            <Link href="/admin/events">
              <AdminCard className="border-amber-500/30 p-4 transition-colors hover:bg-surface-2">
                <p className="text-sm font-medium text-amber-400">
                  {t("pendingEvents", { count: counts.pendingEvents })}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("reviewQueue")}
                </p>
              </AdminCard>
            </Link>
          ) : null}
          {counts.pendingPosts > 0 ? (
            <Link href="/admin/posts">
              <AdminCard className="border-amber-500/30 p-4 transition-colors hover:bg-surface-2">
                <p className="text-sm font-medium text-amber-400">
                  {t("pendingPosts", { count: counts.pendingPosts })}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("reviewQueue")}
                </p>
              </AdminCard>
            </Link>
          ) : null}
          {counts.pendingBusinesses > 0 ? (
            <Link href="/admin/users">
              <AdminCard className="border-amber-500/30 p-4 transition-colors hover:bg-surface-2">
                <p className="text-sm font-medium text-amber-400">
                  {t("pendingBusinesses", { count: counts.pendingBusinesses })}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("reviewAccounts")}
                </p>
              </AdminCard>
            </Link>
          ) : null}
          {counts.unreadMessages > 0 ? (
            <Link href="/admin/messages">
              <AdminCard className="border-amber-500/30 p-4 transition-colors hover:bg-surface-2">
                <p className="text-sm font-medium text-amber-400">
                  {t("unreadMessages", { count: counts.unreadMessages })}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("openInbox")}
                </p>
              </AdminCard>
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          label={t("totalUsers")}
          value={analytics.totalUsers}
          delta={analytics.deltas.totalUsers}
        />
        <AdminStatCard
          label={t("totalEvents")}
          value={analytics.totalEvents}
          delta={analytics.deltas.totalEvents}
        />
        <AdminStatCard
          label={t("published")}
          value={analytics.publishedEvents}
        />
        <AdminStatCard
          label={t("pendingReview")}
          value={analytics.pendingEvents}
          hint={t("pendingReviewHint")}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          label={t("businesses")}
          value={analytics.totalBusinesses}
          delta={analytics.deltas.totalBusinesses}
        />
        <AdminStatCard label={t("venues")} value={analytics.totalVenues} />
        <AdminStatCard label={t("organizers")} value={analytics.totalOrganizers} />
        <AdminStatCard
          label={t("activePromotions")}
          value={analytics.activePromotions}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          label={t("totalRevenue")}
          value={formatMoney(analytics.totalRevenueCents, "ron")}
          delta={analytics.deltas.totalRevenueCents}
          hint={t("totalRevenueHint")}
        />
        <AdminStatCard
          label={t("activeSubscriptions")}
          value={analytics.activeSubscriptions}
        />
      </div>

      {analytics.revenueBreakdown.length > 0 ? (
        <AdminCard className="mt-4 p-5">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("revenueByType")}
          </h2>
          <ul className="mt-3 space-y-2">
            {analytics.revenueBreakdown.map((item) => {
              const key = productKey(item.key);
              return (
                <li
                  key={item.key}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">
                    {tProducts.has(key) ? tProducts(key) : item.label}
                  </span>
                  <span className="font-medium text-foreground">
                    {formatMoney(item.amountCents, "ron")}
                  </span>
                </li>
              );
            })}
          </ul>
        </AdminCard>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <AdminStatCard
          label={tMetrics("views")}
          value={analytics.analytics.views}
          delta={analytics.deltas.views}
          href="/admin/analytics?metric=views"
        />
        <AdminStatCard
          label={tMetrics("saves")}
          value={analytics.analytics.saves}
          delta={analytics.deltas.saves}
          href="/admin/analytics?metric=saves"
        />
        <AdminStatCard
          label={tMetrics("clicks")}
          value={analytics.analytics.clicks}
          delta={analytics.deltas.clicks}
          href="/admin/analytics?metric=clicks"
        />
        <AdminStatCard
          label={tMetrics("ticketClicks")}
          value={analytics.analytics.ticketClicks}
          delta={analytics.deltas.ticketClicks}
          href="/admin/analytics?metric=ticketClicks"
        />
        <AdminStatCard
          label={tMetrics("shares")}
          value={analytics.analytics.shares}
          delta={analytics.deltas.shares}
          href="/admin/analytics?metric=shares"
        />
      </div>
    </div>
  );
}
