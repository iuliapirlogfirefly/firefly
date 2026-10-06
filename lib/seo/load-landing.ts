import { cache } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getEvents } from "@/lib/queries/events";
import { generatePageMetadata } from "@/lib/seo/metadata";
import {
  facetById,
  filtersForLanding,
  isTimeFacet,
  landingPaths,
  resolveFacetSlug,
  resolveHubSlug,
  type FacetId,
  type LandingId,
} from "@/lib/seo/landings";
import type { Locale } from "@/types";
import type { Metadata } from "next";
import type { EventListItem } from "@/types/events";

export type LoadedLanding = {
  locale: Locale;
  hubId: LandingId;
  facetId?: FacetId;
  kind: "list" | "guide" | "clubs";
  events: EventListItem[];
  index: boolean;
  paths: { en: string; ro: string };
};

function asLocale(value: string): Locale {
  if (value === "en" || value === "ro") return value;
  notFound();
}

async function landingEvents(
  locale: Locale,
  hubId: LandingId,
  facetId?: FacetId
): Promise<EventListItem[]> {
  if (hubId === "nightlife") return [];
  return getEvents(locale, filtersForLanding(hubId, facetId));
}

export const loadHubLanding = cache(async function loadHubLanding(
  locale: Locale,
  slug: string
): Promise<{ redirectTo: string } | LoadedLanding | null> {
  const resolved = resolveHubSlug(locale, slug);
  if (!resolved) return null;
  if (resolved.redirectTo) return { redirectTo: resolved.redirectTo };

  const events = await landingEvents(locale, resolved.hub.id);
  return {
    locale,
    hubId: resolved.hub.id,
    kind: resolved.hub.kind,
    events,
    index: resolved.hub.kind === "guide" || events.length > 0,
    paths: landingPaths(resolved.hub.id),
  };
});

export const loadFacetLanding = cache(async function loadFacetLanding(
  locale: Locale,
  landingSlug: string,
  facetSlug: string
): Promise<{ redirectTo: string } | LoadedLanding | null> {
  const resolved = resolveFacetSlug(locale, landingSlug, facetSlug);
  if (!resolved) return null;
  if (resolved.redirectTo) return { redirectTo: resolved.redirectTo };

  const events = await landingEvents(locale, "parties", resolved.facet.id);
  return {
    locale,
    hubId: "parties",
    facetId: resolved.facet.id,
    kind: "list",
    events,
    index: events.length > 0,
    paths: landingPaths("parties", resolved.facet.id),
  };
});

export async function landingCopy(
  locale: Locale,
  hubId: LandingId,
  facetId?: FacetId
): Promise<{ title: string; description: string; intro: string; guide?: string }> {
  const t = await getTranslations({ locale, namespace: "seo" });
  if (facetId) {
    if (!isTimeFacet(facetId)) {
      const genre = facetById(facetId).genre;
      const tGenres = await getTranslations({ locale, namespace: "genres" });
      const label = genre ? tGenres(genre) : facetId;
      return {
        title: t("genreTitle", { genre: label }),
        description: t("genreDescription", { genre: label }),
        intro: t("genreIntro", { genre: label }),
      };
    }
    return {
      title: t(`facets.${facetId}.title`),
      description: t(`facets.${facetId}.description`),
      intro: t(`facets.${facetId}.intro`),
    };
  }

  return {
    title: t(`hubs.${hubId}.title`),
    description: t(`hubs.${hubId}.description`),
    intro: t(`hubs.${hubId}.intro`),
    ...(hubId === "nightlife" ? { guide: t("hubs.nightlife.guide") } : {}),
  };
}

export async function landingMetadata(loaded: LoadedLanding): Promise<Metadata> {
  const copy = await landingCopy(loaded.locale, loaded.hubId, loaded.facetId);
  return generatePageMetadata(
    copy.title,
    copy.description,
    loaded.locale,
    loaded.paths[loaded.locale],
    {
      index: loaded.index,
      paths: loaded.paths,
    }
  );
}

export async function settleHubLanding(
  localeParam: string,
  slug: string
): Promise<LoadedLanding> {
  const locale = asLocale(localeParam);
  setRequestLocale(locale);
  const loaded = await loadHubLanding(locale, slug);
  if (!loaded) notFound();
  if ("redirectTo" in loaded) {
    redirect({ href: loaded.redirectTo, locale });
    notFound();
  }
  return loaded;
}

export async function settleFacetLanding(
  localeParam: string,
  landingSlug: string,
  facetSlug: string
): Promise<LoadedLanding> {
  const locale = asLocale(localeParam);
  setRequestLocale(locale);
  const loaded = await loadFacetLanding(locale, landingSlug, facetSlug);
  if (!loaded) notFound();
  if ("redirectTo" in loaded) {
    redirect({ href: loaded.redirectTo, locale });
    notFound();
  }
  return loaded;
}
