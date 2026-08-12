import { AdminAnalyticsPage } from "@/components/admin/admin-analytics-page";
import {
  getAdminEventAnalytics,
  type EngagementMetric,
} from "@/lib/queries/analytics";
import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
  searchParams: Promise<{ metric?: string }>;
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
  const { metric: rawMetric } = await searchParams;
  setRequestLocale(locale);

  const metric: EngagementMetric = VALID_METRICS.includes(
    rawMetric as EngagementMetric
  )
    ? (rawMetric as EngagementMetric)
    : "views";

  const events = await getAdminEventAnalytics(locale, metric);

  return <AdminAnalyticsPage events={events} metric={metric} />;
}
