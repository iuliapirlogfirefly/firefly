import type { MetadataRoute } from "next";
import { isPrelaunchActive } from "@/lib/launch/settings";
import { getEvents } from "@/lib/queries/events";
import {
  LANDING_FACETS,
  LANDING_HUBS,
  eventMatchesLanding,
  facetPath,
  filtersForLanding,
  hubPath,
} from "@/lib/seo/landings";
import { appOrigin } from "@/lib/seo/metadata";
import type { EventListItem } from "@/types/events";

function localizedEntry(
  origin: string,
  enPath: string,
  roPath: string
): MetadataRoute.Sitemap {
  const en = `${origin}/en${enPath}`;
  const ro = `${origin}/ro${roPath}`;
  const languages = { en, ro, "x-default": en };
  return [
    { url: en, alternates: { languages } },
    { url: ro, alternates: { languages } },
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = appOrigin();
  const staticPaths = ["/", "/privacy", "/terms", "/cookies"];
  const entries = staticPaths.flatMap((path) =>
    localizedEntry(origin, path, path)
  );

  if (await isPrelaunchActive()) return entries;

  let events: EventListItem[] = [];
  try {
    events = await getEvents("en");
  } catch {
    return entries;
  }

  for (const event of events) {
    const path = `/events/${event.slug}`;
    entries.push(...localizedEntry(origin, path, path));
  }

  for (const hub of LANDING_HUBS) {
    const filters = filtersForLanding(hub.id);
    const hasEvents =
      hub.kind === "guide" ||
      events.some((event) => eventMatchesLanding(event, filters));
    if (!hasEvents) continue;
    entries.push(
      ...localizedEntry(origin, hubPath("en", hub.id), hubPath("ro", hub.id))
    );
  }

  for (const facet of LANDING_FACETS) {
    const filters = filtersForLanding("parties", facet.id);
    const hasEvents = events.some((event) =>
      eventMatchesLanding(event, filters)
    );
    if (!hasEvents) continue;
    entries.push(
      ...localizedEntry(origin, facetPath("en", facet.id), facetPath("ro", facet.id))
    );
  }

  return entries;
}
