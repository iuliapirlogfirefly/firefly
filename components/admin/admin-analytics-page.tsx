"use client";

import { Link } from "@/i18n/navigation";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { formatDateBadge } from "@/lib/utils/event-format";
import type {
  EngagementMetric,
  EventAnalyticsRow,
} from "@/lib/queries/analytics";

const METRIC_LABELS: Record<EngagementMetric, string> = {
  views: "Views",
  saves: "Saves",
  clicks: "Clicks",
  ticketClicks: "Ticket clicks",
  shares: "Shares",
};

type Props = {
  events: EventAnalyticsRow[];
  metric: EngagementMetric;
};

export function AdminAnalyticsPage({ events, metric }: Props) {
  return (
    <div data-route="admin-analytics">
      <div className="mb-2">
        <Link
          href="/admin"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Overview
        </Link>
      </div>
      <h1 className="font-heading text-2xl font-semibold md:text-3xl">
        Events by {METRIC_LABELS[metric].toLowerCase()}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Click an event to open it in the admin editor.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {(Object.keys(METRIC_LABELS) as EngagementMetric[]).map((key) => (
          <Link
            key={key}
            href={`/admin/analytics?metric=${key}`}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              key === metric
                ? "bg-foreground text-background"
                : "border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {METRIC_LABELS[key]}
          </Link>
        ))}
      </div>

      {events.length === 0 ? (
        <AdminCard className="mt-8 p-8 text-center text-sm text-muted-foreground">
          No events with analytics yet.
        </AdminCard>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-border bg-surface-1 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Views</th>
                <th className="px-4 py-3 font-medium">Saves</th>
                <th className="px-4 py-3 font-medium">Clicks</th>
                <th className="px-4 py-3 font-medium">Tickets</th>
                <th className="px-4 py-3 font-medium">Shares</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr
                  key={event.id}
                  className="border-b border-border/50 hover:bg-surface-1/50"
                >
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/admin/events/${event.id}/edit`}
                      className="hover:underline"
                    >
                      {event.title}
                      {event.isPromoted ? (
                        <span className="ml-2 text-xs text-amber-400">
                          Promoted
                        </span>
                      ) : null}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateBadge(event.startsAt)}
                  </td>
                  <td className="px-4 py-3">
                    <AdminBadge status={event.status as "pending"}>
                      {event.status}
                    </AdminBadge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {event.views.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {event.saves.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {event.clicks.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {event.ticketClicks.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {event.shares.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
