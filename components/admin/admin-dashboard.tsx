import { Link } from "@/i18n/navigation";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminStatCard } from "@/components/admin/ui/admin-stat-card";
import type { AdminAnalytics } from "@/lib/queries/analytics";
import type { AdminPendingCounts } from "@/lib/queries/admin";

type Props = {
  analytics: AdminAnalytics;
  counts: AdminPendingCounts;
};

export function AdminDashboard({ analytics, counts }: Props) {
  const hasPending =
    counts.pendingEvents > 0 ||
    counts.pendingPosts > 0 ||
    counts.pendingBusinesses > 0;

  return (
    <div data-route="admin-dashboard">
      <h1 className="font-heading text-2xl font-semibold text-foreground md:text-3xl">
        Overview
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Platform health and moderation queues.
      </p>

      {hasPending ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {counts.pendingEvents > 0 ? (
            <Link href="/admin/events">
              <AdminCard className="border-amber-500/30 p-4 transition-colors hover:bg-surface-2">
                <p className="text-sm font-medium text-amber-400">
                  {counts.pendingEvents} event{counts.pendingEvents === 1 ? "" : "s"} pending
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Review queue →</p>
              </AdminCard>
            </Link>
          ) : null}
          {counts.pendingPosts > 0 ? (
            <Link href="/admin/posts">
              <AdminCard className="border-amber-500/30 p-4 transition-colors hover:bg-surface-2">
                <p className="text-sm font-medium text-amber-400">
                  {counts.pendingPosts} post{counts.pendingPosts === 1 ? "" : "s"} pending
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Review queue →</p>
              </AdminCard>
            </Link>
          ) : null}
          {counts.pendingBusinesses > 0 ? (
            <Link href="/admin/users">
              <AdminCard className="border-amber-500/30 p-4 transition-colors hover:bg-surface-2">
                <p className="text-sm font-medium text-amber-400">
                  {counts.pendingBusinesses} business
                  {counts.pendingBusinesses === 1 ? "" : "es"} pending
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Review accounts →</p>
              </AdminCard>
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard label="Total users" value={analytics.totalUsers} />
        <AdminStatCard label="Total events" value={analytics.totalEvents} />
        <AdminStatCard
          label="Published"
          value={analytics.publishedEvents}
        />
        <AdminStatCard
          label="Pending review"
          value={analytics.pendingEvents}
          hint="Events awaiting approval"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard label="Businesses" value={analytics.totalBusinesses} />
        <AdminStatCard label="Venues" value={analytics.totalVenues} />
        <AdminStatCard label="Organizers" value={analytics.totalOrganizers} />
        <AdminStatCard
          label="Active promotions"
          value={analytics.activePromotions}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          label="Total revenue"
          value={new Intl.NumberFormat("en", {
            style: "currency",
            currency: analytics.currency.toUpperCase(),
          }).format(analytics.totalRevenueCents / 100)}
          hint="Promotions + subscriptions"
        />
        <AdminStatCard
          label="Active subscriptions"
          value={analytics.activeSubscriptions}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <AdminStatCard label="Views" value={analytics.analytics.views} />
        <AdminStatCard label="Saves" value={analytics.analytics.saves} />
        <AdminStatCard label="Clicks" value={analytics.analytics.clicks} />
        <AdminStatCard
          label="Ticket clicks"
          value={analytics.analytics.ticketClicks}
        />
        <AdminStatCard label="Shares" value={analytics.analytics.shares} />
      </div>
    </div>
  );
}
