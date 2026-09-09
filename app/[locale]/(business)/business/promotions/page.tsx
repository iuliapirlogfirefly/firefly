import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { BusinessPromotionsComingSoon } from "@/components/business/business-promotions-coming-soon";
import { BusinessPromotionsPage } from "@/components/business/business-promotions-page";
import { MOCK_BUSINESS_ACCOUNT_ID } from "@/lib/mocks/data";
import { getSession } from "@/lib/auth/session";
import { isPrelaunchActive } from "@/lib/launch/settings";
import { getBusinessEvents } from "@/lib/queries/events";
import { getBusinessFeedPosts } from "@/lib/queries/feed";
import {
  getBusinessPromotions,
  getBusinessSubscription,
} from "@/lib/queries/promotions";
import { shouldUseMockData, isSupabaseConfigured } from "@/lib/supabase/config";
import type { PromotionType } from "@/types";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
  searchParams: Promise<{
    boost?: string;
    target?: string;
    success?: string;
    subscription?: string;
    canceled?: string;
  }>;
};

const VALID_BOOST_TYPES: PromotionType[] = [
  "event_boost",
  "feed_post",
  "newsletter",
  "social_media",
];

function isPromotionType(value: string | undefined): value is PromotionType {
  return VALID_BOOST_TYPES.includes(value as PromotionType);
}

async function PromotionsContent({
  locale,
  searchParams,
}: {
  locale: "en" | "ro";
  searchParams: Props["searchParams"];
}) {
  const resolvedSearchParams = await searchParams;
  const session = await getSession();
  const businessId = shouldUseMockData()
    ? MOCK_BUSINESS_ACCOUNT_ID
    : session.businessAccountId;

  const initialBoost = isPromotionType(resolvedSearchParams.boost)
    ? resolvedSearchParams.boost
    : undefined;

  const [promotions, subscription, events, feedPosts] = businessId
    ? await Promise.all([
        getBusinessPromotions(businessId, locale),
        getBusinessSubscription(businessId),
        getBusinessEvents(businessId, locale),
        getBusinessFeedPosts(businessId, locale),
      ])
    : [[], null, [], []];

  return (
    <BusinessPromotionsPage
      promotions={promotions}
      subscription={subscription}
      events={events}
      feedPosts={feedPosts}
      initialBoost={initialBoost}
      initialTarget={resolvedSearchParams.target}
      hasBusinessAccount={Boolean(businessId)}
      purchasesEnabled={isSupabaseConfigured()}
    />
  );
}

export default async function PromotionsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (await isPrelaunchActive()) {
    return <BusinessPromotionsComingSoon />;
  }

  return (
    <Suspense
      fallback={
        <div className="animate-pulse">
          <div className="h-8 w-48 rounded bg-foreground/10" />
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-foreground/5" />
            ))}
          </div>
        </div>
      }
    >
      <PromotionsContent locale={locale} searchParams={searchParams} />
    </Suspense>
  );
}
