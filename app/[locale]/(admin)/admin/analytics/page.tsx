import { AdminAnalyticsPage } from "@/components/admin/admin-analytics-page";
import { redirect } from "@/i18n/navigation";
import {
  buildAdminQuery,
  parsePage,
  totalPages,
} from "@/lib/admin/pagination";
import {
  getAdminEventAnalytics,
  type EngagementMetric,
} from "@/lib/queries/analytics";
import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
  searchParams: Promise<{ metric?: string; page?: string }>;
};

const VALID_METRICS: EngagementMetric[] = [
  "views",
  "saves",
  "clicks",
  "ticketClicks",
  "shares",
];

export default async function AdminAnalyticsRoute({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const { metric: rawMetric, page: rawPage } = await searchParams;
  setRequestLocale(locale);

  const metric: EngagementMetric = VALID_METRICS.includes(
    rawMetric as EngagementMetric
  )
    ? (rawMetric as EngagementMetric)
    : "views";
  const page = parsePage(rawPage);

  const events = await getAdminEventAnalytics(locale, metric, page);

  if (page > 1 && (events.total === 0 || page > totalPages(events.total))) {
    redirect({
      href: `/admin/analytics${buildAdminQuery({
        metric: metric === "views" ? undefined : metric,
        page: events.total === 0 ? undefined : totalPages(events.total),
      })}`,
      locale,
    });
  }

  return <AdminAnalyticsPage events={events} metric={metric} />;
}
