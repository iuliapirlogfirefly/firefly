"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BottomNav } from "@/components/BottomNav";
import { EventCard } from "@/components/EventCard";
import { Nav } from "@/components/Nav";
import { useSavedEvents } from "@/hooks/use-saved-events";
import type { EventListItem } from "@/types/events";

type Props = {
  events: EventListItem[];
  serverSavedIds: string[];
};

export function SavedPageClient({ events, serverSavedIds }: Props) {
  const t = useTranslations("discovery");
  const { ids } = useSavedEvents(serverSavedIds);

  const saved = useMemo(
    () => events.filter((event) => ids.includes(event.id)),
    [events, ids]
  );

  return (
    <main data-route="saved" className="relative min-h-screen pb-24 md:pb-12">
      <Nav />

      <section className="mx-auto max-w-7xl px-6 pt-32">
        <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
          ◦ {t("savedEyebrow")}
        </div>
        <h1 className="text-balance font-heading text-5xl font-bold leading-[0.95] md:text-7xl">
          {t("savedTitle")}{" "}
          <span className="text-gradient-firefly">{t("savedTitleAccent")}</span>
        </h1>

        {saved.length === 0 ? (
          <div className="mx-auto mt-20 max-w-md text-center">
            <div className="relative mb-8 inline-block">
              <div
                className="flex h-32 w-32 items-center justify-center rounded-full border-2 border-firefly/30"
                style={{ boxShadow: "inset 0 0 60px rgba(254,247,163,0.1)" }}
              >
                <div className="relative h-3 w-3">
                  <div
                    className="absolute inset-0 animate-firefly-pulse rounded-full bg-firefly"
                    style={{
                      boxShadow:
                        "0 0 30px #FEF7A3, 0 0 60px rgba(254,247,163,0.6)",
                    }}
                  />
                </div>
              </div>
              <div
                className="absolute left-2 top-2 h-1 w-1 animate-firefly-pulse rounded-full bg-firefly"
                style={{
                  animationDelay: "0.5s",
                  boxShadow: "0 0 10px #FEF7A3",
                }}
              />
              <div
                className="absolute bottom-4 right-3 h-1.5 w-1.5 animate-firefly-pulse rounded-full bg-firefly"
                style={{
                  animationDelay: "1.2s",
                  boxShadow: "0 0 10px #FEF7A3",
                }}
              />
            </div>
            <h2 className="mb-3 font-heading text-2xl">
              {t("savedEmptyTitle")}
            </h2>
            <p className="mb-8 text-foreground/60">{t("savedEmptyBody")}</p>
            <Link
              href="/feed"
              className="inline-flex items-center gap-2 rounded-full bg-firefly px-6 py-3 font-medium text-primary-foreground transition-all hover:firefly-glow"
            >
              {t("savedEmptyCta")}
            </Link>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {saved.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      <BottomNav />
    </main>
  );
}
