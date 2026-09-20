import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { EventDetailPage } from "@/components/events/event-detail-page";
import { trackView } from "@/lib/actions/analytics";
import { getEventBySlug, getEvents } from "@/lib/queries/events";
import { generateEventMetadata } from "@/lib/seo/metadata";
import { genresOverlap } from "@/lib/constants/genres";

export const revalidate = 600;

type Props = {
  params: Promise<{ locale: "en" | "ro"; slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const event = await getEventBySlug(slug, locale);
  if (!event) return { title: "Event Not Found" };

  return generateEventMetadata({
    title: event.title,
    description: event.description,
    slug,
    coverImageUrl: event.coverImageUrl,
    locale,
  });
}

export default async function EventDetailRoute({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const event = await getEventBySlug(slug, locale);
  if (!event) notFound();

  await trackView("event", event.id);

  const events = await getEvents(locale);
  const related = events
    .filter(
      (item) => item.id !== event.id && genresOverlap(item.genres, event.genres)
    )
    .slice(0, 3);

  return <EventDetailPage event={event} related={related} />;
}
