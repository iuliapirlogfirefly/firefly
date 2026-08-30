import { setRequestLocale } from "next-intl/server";
import { CalendarPageClient } from "@/components/calendar/calendar-page";
import { parseEventFilters } from "@/lib/filters/event-filters";
import { getCalendarEvents } from "@/lib/queries/events";
import { generatePageMetadata } from "@/lib/seo/metadata";
import { parseCalendarMonthYear } from "@/lib/utils/calendar";

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
  searchParams: Promise<{
    month?: string;
    year?: string;
    genre?: string;
    eventType?: string;
  }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return generatePageMetadata(
    "Calendar",
    "Plan your nights, one glow at a time.",
    locale,
    "/calendar"
  );
}

export default async function CalendarPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  setRequestLocale(locale);

  const { month, year } = parseCalendarMonthYear(resolvedSearchParams);
  const filters = {
    ...parseEventFilters(resolvedSearchParams),
    search: undefined,
  };
  const calendarDays = await getCalendarEvents(locale, month, year, filters);
  const events = calendarDays.flatMap((day) => day.events);

  return (
    <CalendarPageClient
      events={events}
      locale={locale}
      month={month}
      year={year}
      filters={filters}
    />
  );
}
