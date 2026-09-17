import Image from "next/image";
import { ArrowLeft, Clock, MapPin } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BottomNav } from "@/components/BottomNav";
import { EventCard } from "@/components/EventCard";
import { Nav } from "@/components/Nav";
import { EventActions } from "@/components/events/event-actions";
import { formatEventTypeLabel } from "@/lib/constants/event-types";
import { formatGenreLabel } from "@/lib/constants/genres";
import { landingImages } from "@/lib/landing/images";
import {
  formatDateBadge,
  formatPrice,
  formatTimeRange,
} from "@/lib/utils/event-format";
import type { EventDetail, EventListItem } from "@/types/events";

type Props = {
  event: EventDetail;
  related: EventListItem[];
};

export async function EventDetailPage({ event, related }: Props) {
  const locale = await getLocale();
  const t = await getTranslations("event");
  const tCommon = await getTranslations("common");
  const tGenres = await getTranslations("genres");
  const tTypes = await getTranslations("eventTypes");
  const image = event.coverImageUrl ?? landingImages.editorialCrowd;
  const extraImages = event.images.filter((url) => url && url !== image);

  return (
    <main data-route="event-detail" className="relative min-h-screen pb-32 md:pb-16">
      <Nav />

      <section className="relative h-[70vh] min-h-[480px] overflow-hidden">
        <Image
          src={image}
          alt={event.title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/30" />

        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-12 pt-24">
          <Link
            href="/feed"
            className="mb-6 inline-flex w-fit items-center gap-1.5 text-sm text-firefly transition-all hover:gap-3"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToFeed")}
          </Link>

          {event.isPromoted ? (
            <span className="glass mb-4 inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-wider-2 text-firefly">
              {t("promotedStar")}
            </span>
          ) : null}

          <h1 className="max-w-4xl text-balance font-heading text-5xl font-bold leading-[0.95] md:text-7xl">
            {event.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-foreground/80">
            <span className="font-mono text-sm text-firefly">
              {formatDateBadge(event.startsAt, locale)}
            </span>
            <span className="text-foreground/30">·</span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-firefly" />
              {formatTimeRange(event.startsAt, event.endsAt, locale)}
            </span>
            <span className="text-foreground/30">·</span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-firefly" />
              {event.venueName}
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-12 grid max-w-7xl gap-10 px-6 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="mb-4 font-mono text-xs uppercase tracking-wider-2 text-firefly">
            ◦ {t("theNight")}
          </div>
          <p className="max-w-2xl text-lg leading-relaxed text-foreground/80">
            {event.description}
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <span className="rounded-full border border-firefly/30 bg-firefly/10 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-firefly">
              {formatEventTypeLabel(event.eventType, tTypes)}
            </span>
            <span className="rounded-full border border-firefly/30 bg-firefly/10 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-firefly">
              {formatGenreLabel(event.genre, tGenres)}
            </span>
            <span className="rounded-full bg-amber-warm/15 px-3 py-1.5 text-xs font-medium text-amber-warm">
              {formatPrice(event.price, tCommon)}
            </span>
            {event.specialGuest ? (
              <span className="rounded-full border border-firefly/30 bg-firefly/10 px-3 py-1.5 text-xs font-medium text-firefly">
                {event.specialGuest}
              </span>
            ) : null}
            {event.organizerName ? (
              <span className="rounded-full bg-surface-2 px-3 py-1.5 text-xs text-foreground/70">
                {t("byOrganizer", { name: event.organizerName })}
              </span>
            ) : null}
          </div>

          <div className="glass mt-12 max-w-2xl rounded-3xl p-6">
            <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
              ◦ {t("venue")}
            </div>
            <div className="mb-1 font-heading text-2xl">{event.venueName}</div>
            <div className="flex items-center gap-1.5 text-sm text-foreground/60">
              <MapPin className="h-3.5 w-3.5" />
              {event.address}
            </div>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(event.address)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm text-firefly transition-all hover:gap-3"
            >
              {t("openInMaps")}
            </a>
          </div>
        </div>

        <EventActions
          eventId={event.id}
          eventTitle={event.title}
          startsAt={event.startsAt}
          initialSaved={event.isSaved}
          initialReminded={event.isReminded}
          ticketUrl={event.ticketUrl}
          websiteUrl={event.websiteUrl}
        />
      </section>

      {extraImages.length > 0 ? (
        <section className="mx-auto mt-20 max-w-7xl px-6">
          <div className="mb-6 font-mono text-xs uppercase tracking-wider-2 text-firefly">
            ◦ {t("gallery")}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {extraImages.map((url) => (
              <div
                key={url}
                className="relative aspect-square overflow-hidden rounded-2xl"
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {related.length > 0 ? (
        <section className="mx-auto mt-20 max-w-7xl px-6">
          <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
            ◦ {t("moreLikeThis")}
          </div>
          <h2 className="mb-8 font-heading text-3xl font-bold md:text-4xl">
            {t("relatedTitle")}
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <EventCard key={item.id} event={item} />
            ))}
          </div>
        </section>
      ) : null}

      <BottomNav />
    </main>
  );
}
