"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatDateBadge } from "@/lib/utils/event-format";
import type {
  BusinessAnalytics,
  EngagementMetric,
} from "@/lib/queries/analytics";

type Props = {
  analytics: BusinessAnalytics;
  venueName: string;
};

function statusClass(status: string) {
  if (status === "published") return "bg-firefly/10 text-firefly";
  if (status === "draft") return "bg-foreground/10 text-foreground/50";
  if (status === "rejected") return "bg-destructive/15 text-destructive";
  return "bg-amber-warm/15 text-amber-warm";
}

export function BusinessDashboard({ analytics, venueName }: Props) {
  const t = useTranslations("business");
  const tStatus = useTranslations("common.status");
  const tMetrics = useTranslations("common.metrics");
  const locale = useLocale();
  const [sortMetric, setSortMetric] = useState<EngagementMetric | null>(null);

  const sortedEvents = useMemo(() => {
    if (!sortMetric) return analytics.events;
    return [...analytics.events].sort((a, b) => {
      const diff = (b[sortMetric] as number) - (a[sortMetric] as number);
      if (diff !== 0) return diff;
      return new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime();
    });
  }, [analytics.events, sortMetric]);

  const toggleMetric = (metric: EngagementMetric) => {
    setSortMetric((current) => (current === metric ? null : metric));
  };

  return (
    <div data-route="business-dashboard">
      <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
        {t("dashboardEyebrow", { venueName })}
      </div>
      <h1 className="font-heading text-4xl font-bold md:text-5xl">
        {t.rich("pulseHeadline", {
          glow: (chunks) => (
            <span className="text-gradient-firefly">{chunks}</span>
          ),
        })}
      </h1>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("totalEvents")}
          value={analytics.totalEvents}
          delta={analytics.deltas.totalEvents}
        />
        <StatCard label={t("promoted")} value={analytics.promotedEvents} />
        <StatCard label={t("activeBoosts")} value={analytics.activePromotions} />
        <StatCard
          label={tMetrics("views")}
          value={analytics.views}
          delta={analytics.deltas.views}
          onClick={() => toggleMetric("views")}
          active={sortMetric === "views"}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={tMetrics("saves")}
          value={analytics.saves}
          delta={analytics.deltas.saves}
          onClick={() => toggleMetric("saves")}
          active={sortMetric === "saves"}
        />
        <StatCard
          label={tMetrics("clicks")}
          value={analytics.clicks}
          delta={analytics.deltas.clicks}
          onClick={() => toggleMetric("clicks")}
          active={sortMetric === "clicks"}
        />
        <StatCard
          label={tMetrics("ticketClicks")}
          value={analytics.ticketClicks}
          delta={analytics.deltas.ticketClicks}
          onClick={() => toggleMetric("ticketClicks")}
          active={sortMetric === "ticketClicks"}
        />
        <StatCard
          label={tMetrics("shares")}
          value={analytics.shares}
          delta={analytics.deltas.shares}
          onClick={() => toggleMetric("shares")}
          active={sortMetric === "shares"}
        />
      </div>

      <section className="mt-12">
        <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
          {t("performanceEyebrow")}
        </div>
        <h2 className="font-heading text-2xl font-bold md:text-3xl">
          {t("performanceTitle")}
        </h2>
        {sortMetric ? (
          <p className="mt-2 text-sm text-foreground/50">
            {t("sortedBy", { metric: tMetrics(sortMetric) })}
          </p>
        ) : null}

        <ul className="mt-6 space-y-3">
          {sortedEvents.length === 0 ? (
            <li className="glass rounded-2xl p-8 text-center text-sm text-foreground/50">
              {t("emptyEvents")}
            </li>
          ) : null}
          {sortedEvents.map((event) => (
            <li key={event.id}>
              <Link
                href={`/business/events/${event.id}/edit`}
                className="glass flex flex-col gap-3 rounded-2xl p-4 transition-colors hover:bg-firefly/5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider-2 text-firefly">
                      {formatDateBadge(event.startsAt, locale)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider-2 ${statusClass(event.status)}`}
                    >
                      {tStatus(event.status)}
                    </span>
                    {event.isPromoted ? (
                      <span className="text-[10px] text-amber-warm">
                        {t("promoted")}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-1 truncate font-heading text-lg font-semibold">
                    {event.title}
                  </h3>
                  {event.status === "rejected" && event.rejectionReason ? (
                    <p className="mt-1 text-xs text-destructive">
                      Reason: {event.rejectionReason}
                    </p>
                  ) : null}
                </div>
                <dl className="grid grid-cols-5 gap-3 font-mono text-[10px] uppercase tracking-wider-2 text-foreground/50 sm:shrink-0">
                  <div>
                    <dt>{tMetrics("views")}</dt>
                    <dd className="mt-0.5 text-sm font-semibold normal-case tracking-normal text-firefly">
                      {event.views.toLocaleString(locale)}
                    </dd>
                  </div>
                  <div>
                    <dt>{tMetrics("saves")}</dt>
                    <dd className="mt-0.5 text-sm font-semibold normal-case tracking-normal text-foreground">
                      {event.saves.toLocaleString(locale)}
                    </dd>
                  </div>
                  <div>
                    <dt>{tMetrics("clicks")}</dt>
                    <dd className="mt-0.5 text-sm font-semibold normal-case tracking-normal text-foreground">
                      {event.clicks.toLocaleString(locale)}
                    </dd>
                  </div>
                  <div>
                    <dt>{tMetrics("tickets")}</dt>
                    <dd className="mt-0.5 text-sm font-semibold normal-case tracking-normal text-foreground">
                      {event.ticketClicks.toLocaleString(locale)}
                    </dd>
                  </div>
                  <div>
                    <dt>{tMetrics("shares")}</dt>
                    <dd className="mt-0.5 text-sm font-semibold normal-case tracking-normal text-foreground">
                      {event.shares.toLocaleString(locale)}
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
          {t("manageEvents")}
        </Link>
        <Link
          href="/business/posts"
          className="rounded-full border border-firefly/30 px-5 py-2.5 text-sm text-firefly hover:bg-firefly/10"
        >
          {t("posts")}
        </Link>
        <Link
          href="/business/promotions"
          className="rounded-full border border-firefly/30 px-5 py-2.5 text-sm text-firefly hover:bg-firefly/10"
        >
          {t("promotions")}
        </Link>
      </div>
    </div>
  );
}
