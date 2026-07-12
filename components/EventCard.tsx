"use client";

import Image from "next/image";
import { useSavedEvents } from "@/hooks/use-saved-events";
import { Link } from "@/i18n/navigation";
import { landingImages } from "@/lib/landing/images";
import type { EventListItem } from "@/types/events";

type Props = {
  event: EventListItem;
  featured?: boolean;
  showSave?: boolean;
};

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatGenre(genre: EventListItem["genre"]) {
  return genre.replace(/_/g, " ");
}

export function EventCard({
  event,
  featured = false,
  showSave = true,
}: Props) {
  const image = event.coverImageUrl ?? landingImages.editorialCrowd;
  const { has, toggle } = useSavedEvents();
  const saved = has(event.id);

  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border border-firefly/10 bg-card transition-all hover:border-firefly/30 hover:firefly-glow${
        featured ? " flex h-full flex-col" : " h-full"
      }`}
    >
      <Link
        href={`/events/${event.slug}`}
        className={`block${featured ? " flex h-full flex-col" : " h-full"}`}
      >
        <div
          className={`relative overflow-hidden${
            featured ? " min-h-[240px] flex-1" : " aspect-[16/10]"
          }`}
        >
          <Image
            src={image}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
          {event.isPromoted && (
            <span className="absolute left-4 top-4 rounded-full bg-firefly/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider-2 text-firefly">
              Promoted
            </span>
          )}
        </div>

        <div className="shrink-0 space-y-2 p-5">
          <div className="font-mono text-[10px] uppercase tracking-wider-2 text-firefly">
            {formatWhen(event.startsAt)}
          </div>
          <h3 className="font-heading text-xl font-bold leading-tight transition-colors group-hover:text-firefly">
            {event.title}
          </h3>
          <div className="flex items-center justify-between gap-3 text-sm text-foreground/60">
            <span>
              {event.venueName} · {formatGenre(event.genre)}
            </span>
            {event.price != null && (
              <span className="rounded-full bg-amber-warm/15 px-2 py-0.5 text-[10px] font-medium text-amber-warm">
                {event.price} lei
              </span>
            )}
          </div>
        </div>
      </Link>

      {showSave ? (
        <button
          type="button"
          onClick={(clickEvent) => {
            clickEvent.preventDefault();
            clickEvent.stopPropagation();
            toggle(event.id);
          }}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-firefly/40 bg-background/60 text-firefly backdrop-blur-sm transition-colors hover:bg-firefly/10"
          aria-label={saved ? "Unsave event" : "Save event"}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={saved ? "#FEF7A3" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
