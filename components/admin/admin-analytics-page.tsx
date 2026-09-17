"use client";

import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { formatDateBadge } from "@/lib/utils/event-format";
import type {
  EngagementMetric,
  EventAnalyticsRow,
} from "@/lib/queries/analytics";
import type { Locale } from "@/types";

const METRICS: EngagementMetric[] = [
  "views",
  "saves",
  "clicks",
  "ticketClicks",
  "shares",
];

type Props = {
  events: EventAnalyticsRow[];
  metric: EngagementMetric;
};

export function AdminAnalyticsPage({ events, metric }: Props) {
  const t = useTranslations("admin");
  const tMetrics = useTranslations("common.metrics");
  const tCommon = useTranslations("common");
  const locale = useLocale() as Locale;

  return (
    <div data-route="admin-analytics">
      <div className="mb-2">
        <Link
          href="/admin"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {t("backOverview")}
        </Link>
      </div>
      <h1 className="font-heading text-2xl font-semibold md:text-3xl">
        {t("eventsByMetric", { metric: tMetrics(metric) })}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("analyticsSubtitle")}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {METRICS.map((key) => (
          <Link
            key={key}
            href={`/admin/analytics?metric=${key}`}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              key === metric
                ? "bg-foreground text-background"
                : "border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {tMetrics(key)}
          </Link>
        ))}
      </div>

      {events.length === 0 ? (
        <AdminCard className="mt-8 p-8 text-center text-sm text-muted-foreground">
          {t("noAnalytics")}
        </AdminCard>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-border bg-surface-1 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">{t("colEvent")}</th>
                <th className="px-4 py-3 font-medium">{t("colDate")}</th>
                <th className="px-4 py-3 font-medium">{t("colStatus")}</th>
                <th className="px-4 py-3 font-medium">{tMetrics("views")}</th>
                <th className="px-4 py-3 font-medium">{tMetrics("saves")}</th>
                <th className="px-4 py-3 font-medium">{tMetrics("clicks")}</th>
                <th className="px-4 py-3 font-medium">{tMetrics("tickets")}</th>
                <th className="px-4 py-3 font-medium">{tMetrics("shares")}</th>
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
                          {tCommon("promoted")}
                        </span>
                      ) : null}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateBadge(event.startsAt, locale)}
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
