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

export function AdminDashboard({
  analytics,
  counts,
  unreadMessages,
}: Props) {
  const hasPending =
    counts.pendingEvents > 0 ||
    counts.pendingPosts > 0 ||
    counts.pendingBusinesses > 0 ||
    counts.unreadMessages > 0;

  return (
    <div data-route="admin-dashboard">
      <h1 className="font-heading text-2xl font-semibold text-foreground md:text-3xl">
        Overview
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Platform health and moderation queues.
      </p>

      {unreadMessages.length > 0 ? (
        <div className="mt-6 space-y-3">
          <h2 className="text-sm font-medium text-foreground">
            Support notifications
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {unreadMessages.map((message) => (
              <Link key={message.id} href="/admin/messages">
                <AdminCard className="border-amber-500/30 p-4 transition-colors hover:bg-surface-2">
                  <p className="text-sm font-medium text-amber-400">
                    {message.businessName} sent you a message — don&apos;t
                    forget to check it!
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
                  {counts.pendingEvents} event
                  {counts.pendingEvents === 1 ? "" : "s"} pending
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Review queue →
                </p>
              </AdminCard>
            </Link>
          ) : null}
          {counts.pendingPosts > 0 ? (
            <Link href="/admin/posts">
              <AdminCard className="border-amber-500/30 p-4 transition-colors hover:bg-surface-2">
                <p className="text-sm font-medium text-amber-400">
                  {counts.pendingPosts} post
                  {counts.pendingPosts === 1 ? "" : "s"} pending
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Review queue →
                </p>
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
                <p className="mt-1 text-xs text-muted-foreground">
                  Review accounts →
                </p>
              </AdminCard>
            </Link>
          ) : null}
          {counts.unreadMessages > 0 ? (
            <Link href="/admin/messages">
              <AdminCard className="border-amber-500/30 p-4 transition-colors hover:bg-surface-2">
                <p className="text-sm font-medium text-amber-400">
                  {counts.unreadMessages} unread message
                  {counts.unreadMessages === 1 ? "" : "s"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Open inbox →
                </p>
              </AdminCard>
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          label="Total users"
          value={analytics.totalUsers}
          delta={analytics.deltas.totalUsers}
        />
        <AdminStatCard
          label="Total events"
          value={analytics.totalEvents}
          delta={analytics.deltas.totalEvents}
        />
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
        <AdminStatCard
          label="Businesses"
          value={analytics.totalBusinesses}
          delta={analytics.deltas.totalBusinesses}
        />
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
          value={formatMoney(analytics.totalRevenueCents, "ron")}
          delta={analytics.deltas.totalRevenueCents}
          hint="Promotions + subscriptions"
        />
        <AdminStatCard
          label="Active subscriptions"
          value={analytics.activeSubscriptions}
        />
      </div>

      {analytics.revenueBreakdown.length > 0 ? (
        <AdminCard className="mt-4 p-5">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Revenue by type
          </h2>
          <ul className="mt-3 space-y-2">
            {analytics.revenueBreakdown.map((item) => (
              <li
                key={item.key}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium text-foreground">
                  {formatMoney(item.amountCents, "ron")}
                </span>
              </li>
            ))}
          </ul>
        </AdminCard>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <AdminStatCard
          label="Views"
          value={analytics.analytics.views}
          delta={analytics.deltas.views}
          href="/admin/analytics?metric=views"
        />
        <AdminStatCard
          label="Saves"
          value={analytics.analytics.saves}
          delta={analytics.deltas.saves}
          href="/admin/analytics?metric=saves"
        />
        <AdminStatCard
          label="Clicks"
          value={analytics.analytics.clicks}
          delta={analytics.deltas.clicks}
          href="/admin/analytics?metric=clicks"
        />
        <AdminStatCard
          label="Ticket clicks"
          value={analytics.analytics.ticketClicks}
          delta={analytics.deltas.ticketClicks}
          href="/admin/analytics?metric=ticketClicks"
        />
        <AdminStatCard
          label="Shares"
          value={analytics.analytics.shares}
          delta={analytics.deltas.shares}
          href="/admin/analytics?metric=shares"
        />
      </div>
    </div>
  );
}
