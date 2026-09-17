"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { BottomNav } from "@/components/BottomNav";
import { Nav } from "@/components/Nav";
import { getCategoryMeta } from "@/lib/constants/feed-categories";
import { landingImages } from "@/lib/landing/images";
import { MISSED_WINDOW_HOURS } from "@/lib/utils/feed-filters";
import type { FeedPostItem } from "@/lib/queries/feed";
import type { Locale } from "@/types";

type Props = {
  posts: FeedPostItem[];
  locale: Locale;
};

const FALLBACK_IMAGES = [
  landingImages.editorialCrowd,
  landingImages.editorialDj,
  landingImages.editorialStreet,
] as const;

function formatTimeAgo(iso: string, locale: Locale) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);

  const rtf = new Intl.RelativeTimeFormat(locale, {
    numeric: "auto",
  });

  if (minutes < 60) return rtf.format(-Math.max(minutes, 1), "minute");
  if (hours < 24) return rtf.format(-hours, "hour");
  return rtf.format(-days, "day");
}

function MissedPostCard({
  post,
  locale,
  index,
}: {
  post: FeedPostItem;
  locale: Locale;
  index: number;
}) {
  const tCategories = useTranslations("feedCategories");
  const category = getCategoryMeta(post.category, tCategories);
  const image =
    post.mediaUrl ?? FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];

  return (
    <article className="relative h-full w-full snap-start snap-always">
      <div className="relative h-full w-full overflow-hidden rounded-none md:rounded-3xl md:border md:border-firefly/10">
        <Image
          src={image}
          alt=""
          fill
          priority={index < 2}
          sizes="(max-width: 768px) 100vw, 480px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-transparent to-transparent" />

        <div className="absolute inset-x-0 top-0 flex items-start p-5 pt-6 md:p-6">
          <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider-2 text-firefly">
            <span aria-hidden>{category.icon}</span>
            {category.label}
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-5 pb-8 md:p-6 md:pb-10">
          <time
            dateTime={post.publishedAt}
            className="font-mono text-[10px] uppercase tracking-wider-2 text-foreground/50"
          >
            {formatTimeAgo(post.publishedAt, locale)}
          </time>
          <h2 className="mt-2 font-heading text-2xl font-bold leading-tight md:text-3xl">
            {post.title}
          </h2>
          <p className="mt-3 max-w-lg text-pretty text-sm leading-relaxed text-foreground/75 md:text-base">
            {post.description}
          </p>
        </div>
      </div>
    </article>
  );
}

export function MissedPageClient({ posts, locale }: Props) {
  const t = useTranslations("discovery");

  return (
    <main data-route="missed" className="relative h-dvh overflow-hidden bg-background">
      <Nav />

      <div className="pointer-events-none absolute inset-x-0 top-20 z-20 px-4 md:px-0">
        <div className="pointer-events-auto mx-auto max-w-lg">
          <div className="mb-3">
            <div className="font-mono text-[10px] uppercase tracking-wider-2 text-firefly">
              ◦ {t("missedEyebrow")}
            </div>
            <h1 className="font-heading text-xl font-bold leading-tight md:text-2xl">
              {t("missedTitle")}
            </h1>
            <p className="mt-1 max-w-sm text-xs text-foreground/60">
              {t("missedSubtitle", { hours: MISSED_WINDOW_HOURS })}
            </p>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-16 top-[10.5rem] z-10 md:bottom-0 md:top-44">
        <div className="mx-auto h-full max-w-lg px-0 md:px-4">
          {posts.length === 0 ? (
            <div className="flex h-full items-center justify-center px-6 text-center">
              <div>
                <div className="mb-4 inline-block h-12 w-12 animate-firefly-pulse rounded-full border border-firefly/30 bg-firefly/10" />
                <p className="text-foreground/60">{t("missedEmpty")}</p>
              </div>
            </div>
          ) : (
            <div className="feed-snap-scroll h-full snap-y snap-mandatory overflow-y-auto scroll-smooth">
              {posts.map((post, index) => (
                <div
                  key={post.id}
                  className="h-full min-h-full pb-3 last:pb-6 md:pb-4"
                >
                  <MissedPostCard post={post} locale={locale} index={index} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
