import { Link } from "@/i18n/navigation";
import { StatCard } from "@/components/dashboard/stat-card";
import type { BusinessAnalytics } from "@/lib/queries/analytics";

type Props = {
  analytics: BusinessAnalytics;
  venueName: string;
};

export function BusinessDashboard({ analytics, venueName }: Props) {
  return (
    <div data-route="business-dashboard">
        <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
          ◦ Business · {venueName}
        </div>
        <h1 className="font-heading text-4xl font-bold md:text-5xl">
          Your venue <span className="text-gradient-firefly">pulse</span>
        </h1>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total events" value={analytics.totalEvents} />
          <StatCard label="Promoted" value={analytics.promotedEvents} />
          <StatCard label="Active boosts" value={analytics.activePromotions} />
          <StatCard label="Views" value={analytics.views} />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Saves" value={analytics.saves} />
          <StatCard label="Clicks" value={analytics.clicks} />
          <StatCard label="Ticket clicks" value={analytics.ticketClicks} />
          <StatCard label="Shares" value={analytics.shares} />
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link
            href="/business/events"
            className="rounded-full bg-firefly px-5 py-2.5 text-sm font-medium text-primary-foreground hover:firefly-glow"
          >
            Manage events
          </Link>
          <Link
            href="/business/posts"
            className="rounded-full border border-firefly/30 px-5 py-2.5 text-sm text-firefly hover:bg-firefly/10"
          >
            Feed posts
          </Link>
          <Link
            href="/business/promotions"
            className="rounded-full border border-firefly/30 px-5 py-2.5 text-sm text-firefly hover:bg-firefly/10"
          >
            Promotions
          </Link>
        </div>
    </div>
  );
}
