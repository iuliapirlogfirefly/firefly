import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { formatDateBadge } from "@/lib/utils/event-format";
import { landingImages } from "@/lib/landing/images";
import type { EventListItem } from "@/types/events";

type BusinessEvent = EventListItem & { status: string };

type Props = {
  events: BusinessEvent[];
};

export function BusinessEventsList({ events }: Props) {
  return (
    <div data-route="business-events">
        <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
          ◦ Business · Events
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-heading text-4xl font-bold">
            Your <span className="text-gradient-firefly">events</span>
          </h1>
          <Link
            href="/business/events/new"
            className="rounded-full bg-firefly px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            New event
          </Link>
        </div>

        <ul className="mt-10 space-y-4">
          {events.length === 0 ? (
            <li className="glass rounded-2xl p-8 text-center text-sm text-foreground/50">
              No events yet — create your first one.
            </li>
          ) : null}
          {events.map((event) => (
            <li key={event.id} className="glass flex gap-4 rounded-2xl p-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
                <Image
                  src={event.coverImageUrl ?? landingImages.editorialCrowd}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider-2 text-firefly">
                    {formatDateBadge(event.startsAt)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider-2 ${
                      event.status === "published"
                        ? "bg-firefly/10 text-firefly"
                        : event.status === "draft"
                          ? "bg-foreground/10 text-foreground/50"
                          : "bg-amber-warm/15 text-amber-warm"
                    }`}
                  >
                    {event.status}
                  </span>
                  {event.isPromoted ? (
                    <span className="text-[10px] text-amber-warm">Promoted</span>
                  ) : null}
                </div>
                <h2 className="mt-1 font-heading text-xl font-semibold">
                  {event.title}
                </h2>
                <p className="text-sm text-foreground/60">{event.venueName}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 self-start">
                {event.status === "published" && !event.isPromoted ? (
                  <Link
                    href={`/business/promotions?boost=event_boost&target=${event.id}`}
                    className="rounded-full bg-firefly px-3 py-1.5 text-xs font-medium text-primary-foreground"
                  >
                    Boost
                  </Link>
                ) : null}
                <Link
                  href={`/business/events/${event.id}/edit`}
                  className="rounded-full border border-firefly/30 px-3 py-1.5 text-xs text-firefly transition-colors hover:bg-firefly/10"
                >
                  Edit
                </Link>
              </div>
            </li>
          ))}
        </ul>
    </div>
  );
}
