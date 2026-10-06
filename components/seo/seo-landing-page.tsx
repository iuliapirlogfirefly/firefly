import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BottomNav } from "@/components/BottomNav";
import { EventCard } from "@/components/EventCard";
import { Nav } from "@/components/Nav";
import { eventItemListJsonLd, jsonLdScript } from "@/lib/seo/json-ld";
import { landingCopy, type LoadedLanding } from "@/lib/seo/load-landing";
import {
  LANDING_FACETS,
  LANDING_HUBS,
  facetById,
  facetPath,
  hubPath,
  isTimeFacet,
  type FacetId,
  type LandingId,
} from "@/lib/seo/landings";
import type { Locale } from "@/types";
import type { EventListItem } from "@/types/events";

type Props = {
  loaded: LoadedLanding;
};

function groupByVenue(events: EventListItem[], fallback: string) {
  const groups = new Map<string, EventListItem[]>();
  for (const event of events) {
    const venue = event.venueName.trim() || fallback;
    const list = groups.get(venue);
    if (list) list.push(event);
    else groups.set(venue, [event]);
  }
  return [...groups.entries()]
    .map(([venue, items]) => ({ venue, events: items }))
    .sort((a, b) => {
      const earliest = (items: EventListItem[]) =>
        Math.min(...items.map((event) => new Date(event.startsAt).getTime()));
      return earliest(a.events) - earliest(b.events);
    });
}

export async function SeoLandingPage({ loaded }: Props) {
  const { locale, hubId, facetId, kind, events } = loaded;
  const [copy, t, tGenres] = await Promise.all([
    landingCopy(locale, hubId, facetId),
    getTranslations({ locale, namespace: "seo" }),
    getTranslations({ locale, namespace: "genres" }),
  ]);
  const jsonLd =
    events.length > 0 ? eventItemListJsonLd(events, locale, copy.title) : null;
  const venueGroups =
    kind === "clubs" ? groupByVenue(events, t("unknownVenue")) : [];

  return (
    <main data-route="seo-landing" className="relative min-h-screen pb-24 md:pb-12">
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
        />
      ) : null}
      <Nav />

      <section className="mx-auto max-w-7xl px-6 pt-32">
        <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
          ◦ Firefly
        </div>
        <h1 className="max-w-4xl text-balance font-heading text-5xl font-bold leading-[0.95] md:text-7xl">
          {copy.title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground/70">
          {copy.intro}
        </p>
        {copy.guide ? (
          <p className="mt-4 max-w-2xl leading-relaxed text-foreground/65">
            {copy.guide}
          </p>
        ) : null}
      </section>

      {kind === "guide" ? null : events.length === 0 ? (
        <section className="mx-auto mt-12 max-w-7xl px-6">
          <p className="max-w-xl text-foreground/60">{t("empty")}</p>
        </section>
      ) : kind === "clubs" ? (
        <div className="mx-auto mt-12 max-w-7xl px-6">
          {venueGroups.map((group) => (
            <section key={group.venue} className="mt-10">
              <h2 className="mb-6 font-heading text-3xl font-bold">
                {group.venue}
              </h2>
              <EventGrid events={group.events} />
            </section>
          ))}
        </div>
      ) : (
        <section className="mx-auto mt-12 max-w-7xl px-6">
          <EventGrid events={events} />
        </section>
      )}

      {kind === "guide" ? (
        <NightlifeGuideLinks locale={locale} />
      ) : (
        <LandingLinkRows
          locale={locale}
          hubId={hubId}
          facetId={facetId}
          also={t("also")}
          when={t("when")}
          sounds={t("sounds")}
          hubTitle={(id) => t(`hubs.${id}.title`)}
          facetTitle={(id) =>
            isTimeFacet(id)
              ? t(`facets.${id}.title`)
              : t("genreTitle", {
                  genre: tGenres(facetById(id).genre ?? "other"),
                })
          }
        />
      )}

      <BottomNav />
    </main>
  );
}

function EventGrid({ events }: { events: EventListItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}

function LinkRow({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  if (links.length === 0) return null;
  return (
    <div>
      <h2 className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
        {title}
      </h2>
      <ul className="flex flex-wrap gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex rounded-full border border-firefly/25 px-3 py-1.5 text-sm text-foreground/80 transition-colors hover:border-firefly/60 hover:text-firefly"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LandingLinkRows({
  locale,
  hubId,
  facetId,
  also,
  when,
  sounds,
  hubTitle,
  facetTitle,
}: {
  locale: Locale;
  hubId: LandingId;
  facetId?: FacetId;
  also: string;
  when: string;
  sounds: string;
  hubTitle: (id: LandingId) => string;
  facetTitle: (id: FacetId) => string;
}) {
  const showWhen = hubId === "parties" || hubId === "events" || Boolean(facetId);
  const showSounds =
    (hubId === "parties" && !facetId) ||
    (facetId != null && !isTimeFacet(facetId));

  return (
    <section className="mx-auto mt-16 max-w-7xl space-y-8 px-6">
      <LinkRow
        title={also}
        links={LANDING_HUBS.filter((hub) => hub.id !== hubId).map((hub) => ({
          href: hubPath(locale, hub.id),
          label: hubTitle(hub.id),
        }))}
      />
      {showWhen ? (
        <LinkRow
          title={when}
          links={LANDING_FACETS.filter(
            (facet) => facet.time && facet.id !== facetId
          ).map((facet) => ({
            href: facetPath(locale, facet.id),
            label: facetTitle(facet.id),
          }))}
        />
      ) : null}
      {showSounds ? (
        <LinkRow
          title={sounds}
          links={LANDING_FACETS.filter(
            (facet) => facet.genre && facet.id !== facetId
          ).map((facet) => ({
            href: facetPath(locale, facet.id),
            label: facetTitle(facet.id),
          }))}
        />
      ) : null}
    </section>
  );
}

async function NightlifeGuideLinks({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "seo" });
  const tGenres = await getTranslations({ locale, namespace: "genres" });
  const timeIds: FacetId[] = ["tonight", "weekend", "this_week"];

  return (
    <section className="mx-auto mt-12 max-w-7xl space-y-8 px-6">
      <LinkRow
        title={t("when")}
        links={timeIds.map((id) => ({
          href: facetPath(locale, id),
          label: t(`facets.${id}.title`),
        }))}
      />
      <LinkRow
        title={t("places")}
        links={(["clubs", "concerts", "parties", "events"] as LandingId[]).map(
          (id) => ({
            href: hubPath(locale, id),
            label: t(`hubs.${id}.title`),
          })
        )}
      />
      <LinkRow
        title={t("sounds")}
        links={LANDING_FACETS.filter((facet) => facet.genre).map((facet) => ({
          href: facetPath(locale, facet.id),
          label: t("genreTitle", {
            genre: tGenres(facet.genre ?? "other"),
          }),
        }))}
      />
    </section>
  );
}
