"use client";

import { LayoutDashboard } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BottomNav } from "@/components/BottomNav";
import { EventCard } from "@/components/EventCard";
import { Nav } from "@/components/Nav";
import { useSession } from "@/components/session-provider";
import { useSavedEvents } from "@/hooks/use-saved-events";
import { SignOutButton } from "@/components/ui/sign-out-button";
import { signOut } from "@/lib/actions/auth";
import type { NearbyPreferences } from "@/lib/actions/profile";
import { NearbyEventsSettings } from "@/components/profile/nearby-events-settings";
import { NewsletterSettings } from "@/components/profile/newsletter-settings";
import type { EventListItem, SessionInfo } from "@/types/events";

type Props = {
  events: EventListItem[];
  serverSavedIds: string[];
  session: SessionInfo;
  nearbyPreferences: NearbyPreferences | null;
  newsletterOptIn: boolean;
};

export function ProfilePageClient({
  events,
  serverSavedIds,
  session,
  nearbyPreferences,
  newsletterOptIn,
}: Props) {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const clientSession = useSession();
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";
  const { ids } = useSavedEvents(serverSavedIds);

  const isLoggedIn = Boolean(clientSession.userId ?? session.userId);
  const isBusiness =
    (clientSession.role ?? session.role) === "business_venue" ||
    (clientSession.role ?? session.role) === "business_organizer";
  const displayName =
    clientSession.displayName ??
    session.displayName ??
    t("defaultDisplayName");
  const email = clientSession.email ?? session.email;

  const saved = useMemo(
    () => events.filter((event) => ids.includes(event.id)),
    [events, ids]
  );

  const glow = (chunks: ReactNode) => (
    <span className="text-gradient-firefly">{chunks}</span>
  );

  return (
    <main data-route="profile" className="relative min-h-screen pb-24 md:pb-12">
      <Nav />

      <section className="mx-auto max-w-7xl px-6 pt-32">
        <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
          {t("eyebrowAccount")}
        </div>
        <h1 className="text-balance font-heading text-5xl font-bold leading-[0.95] md:text-7xl">
          {t.rich("headline", { glow })}
        </h1>

        <div className="mt-10 glass rounded-3xl p-6">
          {isLoggedIn ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="font-heading text-2xl font-semibold">
                  {displayName}
                </div>
                {email ? (
                  <div className="mt-1 text-sm text-foreground/60">{email}</div>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {isBusiness ? (
                  <Link
                    href="/business"
                    className="inline-flex items-center gap-2 rounded-full border border-firefly/30 px-4 py-2 font-mono text-[11px] uppercase tracking-wider-2 text-firefly transition-colors hover:bg-firefly/10"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    {t("businessDashboard")}
                  </Link>
                ) : null}
                <form action={signOut.bind(null, locale)}>
                  <SignOutButton
                    label={tCommon("signOut")}
                    pendingLabel={tCommon("signingOut")}
                    className="rounded-full border border-foreground/20 px-4 py-2 font-mono text-[11px] uppercase tracking-wider-2 text-foreground/60 transition-colors hover:border-foreground/40 hover:text-foreground/90"
                  />
                </form>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="font-heading text-xl font-semibold">
                  {t("guestTitle")}
                </div>
                <p className="mt-1 max-w-md text-sm text-foreground/60">
                  {t("guestBody")}
                </p>
              </div>
              <Link
                href="/auth"
                className="inline-flex rounded-full bg-firefly px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:firefly-glow"
              >
                {t("signIn")}
              </Link>
            </div>
          )}
        </div>

        {isLoggedIn ? (
          <>
            <NewsletterSettings initialOptIn={newsletterOptIn} />
            <NearbyEventsSettings initial={nearbyPreferences} />
          </>
        ) : null}

        <div id="saved" className="mt-14 scroll-mt-32">
          <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
            {t("eyebrowSaved")}
          </div>
          <h2 className="font-heading text-3xl font-bold md:text-4xl">
            {t.rich("jarHeadline", { glow })}
          </h2>

          {saved.length === 0 ? (
            <div className="mx-auto mt-16 max-w-md text-center">
              <div className="relative mb-8 inline-block">
                <div
                  className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-firefly/30"
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
              </div>
              <p className="mb-8 text-foreground/60">{t("emptySaved")}</p>
              <Link
                href="/map"
                className="inline-flex items-center gap-2 rounded-full bg-firefly px-6 py-3 font-medium text-primary-foreground transition-all hover:firefly-glow"
              >
                {t("exploreMap")}
              </Link>
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {saved.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
