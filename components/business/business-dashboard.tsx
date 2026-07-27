import { Link } from "@/i18n/navigation";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatDateBadge } from "@/lib/utils/event-format";
import type { BusinessAnalytics } from "@/lib/queries/analytics";

type Props = {
  analytics: BusinessAnalytics;
  venueName: string;
};

function statusClass(status: string) {
  if (status === "published") return "bg-firefly/10 text-firefly";
  if (status === "draft") return "bg-foreground/10 text-foreground/50";
  return "bg-amber-warm/15 text-amber-warm";
}

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

        <section className="mt-12">
          <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
            ◦ Event performance
          </div>
          <h2 className="font-heading text-2xl font-bold md:text-3xl">
            How each event performed
          </h2>

          <ul className="mt-6 space-y-3">
            {analytics.events.length === 0 ? (
              <li className="glass rounded-2xl p-8 text-center text-sm text-foreground/50">
                No events yet — create your first one to see performance.
              </li>
            ) : null}
            {analytics.events.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/business/events/${event.id}/edit`}
                  className="glass flex flex-col gap-3 rounded-2xl p-4 transition-colors hover:bg-firefly/5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider-2 text-firefly">
                        {formatDateBadge(event.startsAt)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider-2 ${statusClass(event.status)}`}
                      >
                        {event.status}
                      </span>
                      {event.isPromoted ? (
                        <span className="text-[10px] text-amber-warm">
                          Promoted
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-1 truncate font-heading text-lg font-semibold">
                      {event.title}
                    </h3>
                  </div>
                  <dl className="grid grid-cols-5 gap-3 font-mono text-[10px] uppercase tracking-wider-2 text-foreground/50 sm:shrink-0">
                    <div>
                      <dt>Views</dt>
                      <dd className="mt-0.5 text-sm font-semibold normal-case tracking-normal text-firefly">
                        {event.views.toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt>Saves</dt>
                      <dd className="mt-0.5 text-sm font-semibold normal-case tracking-normal text-foreground">
                        {event.saves.toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt>Clicks</dt>
                      <dd className="mt-0.5 text-sm font-semibold normal-case tracking-normal text-foreground">
                        {event.clicks.toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt>Tickets</dt>
                      <dd className="mt-0.5 text-sm font-semibold normal-case tracking-normal text-foreground">
                        {event.ticketClicks.toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt>Shares</dt>
                      <dd className="mt-0.5 text-sm font-semibold normal-case tracking-normal text-foreground">
                        {event.shares.toLocaleString()}
                      </dd>
                    </div>
                  </dl>
                </Link>
              </li>
            ))}
          </ul>
        </section>

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
