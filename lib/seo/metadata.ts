import type { Metadata } from "next";
import type { Locale } from "@/types";

const DEFAULT_SHARE_IMAGE = "/images/hero-frame-club.jpg";

type PageMetadataOptions = {
  index?: boolean;
  follow?: boolean;
  paths?: { en: string; ro: string };
  image?: string | null;
};

type EventMetadataInput = {
  title: string;
  description: string;
  slug: string;
  startsAt: string;
  coverImageUrl?: string | null;
  locale: Locale;
};

const APEX_ORIGIN = "https://fireflyapp.ro";
const PUBLIC_ORIGIN = "https://www.fireflyapp.ro";

export function appOrigin(): string {
  const configured = (
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");
  // Vercel redirects the apex host to www before the app runs. Sitemap,
  // canonical, and hreflang have to name the host that returns 200.
  if (configured === APEX_ORIGIN) return PUBLIC_ORIGIN;
  return configured;
}

export function localeUrl(locale: string, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const suffix = normalized === "/" ? "" : normalized.replace(/\/$/, "");
  return `${appOrigin()}/${locale}${suffix}`;
}

export function absoluteUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${appOrigin()}${path}`;
}

function shareImage(image?: string | null): string {
  const trimmed = image?.trim();
  return trimmed ? trimmed : DEFAULT_SHARE_IMAGE;
}

function metaDescription(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= 160) return clean;
  return `${clean.slice(0, 157).trimEnd()}…`;
}

const CITY = {
  en: "Bucharest",
  ro: "București",
} as const;

const CITY_IN_TITLE = {
  en: /bucharest/i,
  ro: /bucure[sș]ti/i,
} as const;

export function formatEventSeoTitle(
  title: string,
  startsAt: string,
  locale: Locale
): string {
  const date = new Intl.DateTimeFormat(locale === "ro" ? "ro-RO" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Bucharest",
  }).format(new Date(startsAt));
  const name = CITY_IN_TITLE[locale].test(title)
    ? title.trim()
    : `${title.trim()} ${CITY[locale]}`;
  return `${name} – ${date}`;
}

function pagePaths(path: string, options?: PageMetadataOptions) {
  return options?.paths ?? { en: path, ro: path };
}

function socialMetadata(
  title: string,
  description: string,
  url: string,
  locale: Locale,
  image?: string | null
): Pick<Metadata, "openGraph" | "twitter"> {
  const shareTitle = `${title} | Firefly`;
  const images = [shareImage(image)];
  return {
    openGraph: {
      title: shareTitle,
      description,
      url,
      siteName: "Firefly",
      locale: locale === "ro" ? "ro_RO" : "en_US",
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description,
      images,
    },
  };
}

export function generateEventMetadata({
  title,
  description,
  slug,
  startsAt,
  coverImageUrl,
  locale,
}: EventMetadataInput): Metadata {
  const seoTitle = formatEventSeoTitle(title, startsAt, locale);
  const summary = metaDescription(description);
  const url = localeUrl(locale, `/events/${slug}`);

  return {
    title: `${seoTitle} | Firefly`,
    description: summary,
    alternates: {
      canonical: url,
      languages: {
        en: localeUrl("en", `/events/${slug}`),
        ro: localeUrl("ro", `/events/${slug}`),
        "x-default": localeUrl("en", `/events/${slug}`),
      },
    },
    ...socialMetadata(seoTitle, summary, url, locale, coverImageUrl),
  };
}

export function generatePageMetadata(
  title: string,
  description: string,
  locale: Locale,
  path: string,
  options?: PageMetadataOptions
): Metadata {
  const paths = pagePaths(path, options);
  const summary = metaDescription(description);
  const url = localeUrl(locale, paths[locale]);
  const index = options?.index !== false;

  return {
    title: `${title} | Firefly`,
    description: summary,
    alternates: {
      canonical: url,
      languages: {
        en: localeUrl("en", paths.en),
        ro: localeUrl("ro", paths.ro),
        "x-default": localeUrl("en", paths.en),
      },
    },
    ...socialMetadata(title, summary, url, locale, options?.image),
    ...(index
      ? {}
      : {
          robots: {
            index: false,
            follow: options?.follow ?? true,
          },
        }),
  };
}
