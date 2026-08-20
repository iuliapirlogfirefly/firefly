import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { FeedPageClient } from "@/components/feed/feed-page";
import { parseEventFilters } from "@/lib/filters/event-filters";
import { getEvents } from "@/lib/queries/events";
import { generatePageMetadata } from "@/lib/seo/metadata";
import { parseFeedView } from "@/lib/utils/feed-filters";

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
  searchParams: Promise<{
    view?: string;
    genre?: string;
    eventType?: string;
    datePreset?: string;
    customDate?: string;
    search?: string;
    promotedOnly?: string;
    distanceKm?: string;
    lat?: string;
    lng?: string;
  }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return generatePageMetadata(
    "Tonight",
    "Every party glowing this week.",
    locale,
    "/feed"
  );
}

export default async function FeedPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  setRequestLocale(locale);

  if (parseFeedView(resolvedSearchParams.view) === "missed") {
    redirect(`/${locale}/missed`);
  }

  const filters = parseEventFilters(resolvedSearchParams);
  const events = await getEvents(locale, filters);

  return (
    <FeedPageClient events={events} locale={locale} filters={filters} />
  );
}
