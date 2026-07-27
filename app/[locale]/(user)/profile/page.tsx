import { setRequestLocale } from "next-intl/server";
import { ProfilePageClient } from "@/components/profile/profile-page";
import {
  getNearbyPreferences,
  getNewsletterOptIn,
} from "@/lib/actions/profile";
import { getSession } from "@/lib/auth/session";
import { getEvents, getSavedEvents } from "@/lib/queries/events";
import { generatePageMetadata } from "@/lib/seo/metadata";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return generatePageMetadata(
    "Account",
    "Your profile and saved nights.",
    locale,
    "/profile"
  );
}

export default async function ProfilePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [session, events, serverSaved, nearbyPreferences, newsletterOptIn] =
    await Promise.all([
      getSession(),
      getEvents(locale),
      getSavedEvents(locale),
      getNearbyPreferences(),
      getNewsletterOptIn(),
    ]);

  return (
    <ProfilePageClient
      events={events}
      serverSavedIds={serverSaved.map((event) => event.id)}
      session={session}
      nearbyPreferences={nearbyPreferences}
      newsletterOptIn={newsletterOptIn ?? true}
    />
  );
}
