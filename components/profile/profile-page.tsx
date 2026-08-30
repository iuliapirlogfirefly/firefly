"use client";

import { LayoutDashboard } from "lucide-react";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { BottomNav } from "@/components/BottomNav";
import { EventCard } from "@/components/EventCard";
import { Nav } from "@/components/Nav";
import { useSession } from "@/components/session-provider";
import { usePrelaunch } from "@/components/launch-provider";
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
  const clientSession = useSession();
  const isPrelaunch = usePrelaunch();
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";
  const { ids } = useSavedEvents(serverSavedIds);

  const isLoggedIn = Boolean(clientSession.userId ?? session.userId);
  const isBusiness =
    (clientSession.role ?? session.role) === "business_venue" ||
    (clientSession.role ?? session.role) === "business_organizer";
  const displayName =
    clientSession.displayName ?? session.displayName ?? "Night owl";
  const email = clientSession.email ?? session.email;

  const saved = useMemo(
    () => events.filter((event) => ids.includes(event.id)),
    [events, ids]
  );

  return (
    <main data-route="profile" className="relative min-h-screen pb-24 md:pb-12">
      <Nav />

      <section className="mx-auto max-w-7xl px-6 pt-32">
        <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
          ◦ Account
        </div>
        <h1 className="text-balance font-heading text-5xl font-bold leading-[0.95] md:text-7xl">
          Your <span className="text-gradient-firefly">space.</span>
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
                {isBusiness && !isPrelaunch ? (
                  <Link
                    href="/business"
                    className="inline-flex items-center gap-2 rounded-full border border-firefly/30 px-4 py-2 font-mono text-[11px] uppercase tracking-wider-2 text-firefly transition-colors hover:bg-firefly/10"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    Business dashboard
                  </Link>
                ) : null}
                <form action={signOut.bind(null, locale)}>
                  <SignOutButton className="rounded-full border border-foreground/20 px-4 py-2 font-mono text-[11px] uppercase tracking-wider-2 text-foreground/60 transition-colors hover:border-foreground/40 hover:text-foreground/90" />
                </form>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="font-heading text-xl font-semibold">
                  Sign in to sync your jar
                </div>
                <p className="mt-1 max-w-md text-sm text-foreground/60">
                  Saved events stay on this device. Create an account to keep them
                  across devices.
                </p>
              </div>
              <Link
                href="/auth"
                className="inline-flex rounded-full bg-firefly px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:firefly-glow"
              >
                Sign in
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
            ◦ Saved
          </div>
          <h2 className="font-heading text-3xl font-bold md:text-4xl">
            Your jar of <span className="text-gradient-firefly">fireflies.</span>
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
              <p className="mb-8 text-foreground/60">
                Tap the heart on any event to keep it glowing in your jar.
              </p>
              <Link
                href="/map"
                className="inline-flex items-center gap-2 rounded-full bg-firefly px-6 py-3 font-medium text-primary-foreground transition-all hover:firefly-glow"
              >
                Explore the map
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
