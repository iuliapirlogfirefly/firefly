import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { BusinessPromotionsComingSoon } from "@/components/business/business-promotions-coming-soon";
import { BusinessPromotionsPage } from "@/components/business/business-promotions-page";
import { MOCK_BUSINESS_ACCOUNT_ID } from "@/lib/mocks/data";
import { getSession } from "@/lib/auth/session";
import { isPrelaunchActive } from "@/lib/launch/settings";
import { getBusinessEvents } from "@/lib/queries/events";
import {
  getBusinessPromotions,
  getBusinessSubscription,
} from "@/lib/queries/promotions";
import { getFeedPostCreditBalance } from "@/lib/stripe/feed-post-credits";
import { shouldUseMockData, isSupabaseConfigured } from "@/lib/supabase/config";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
  searchParams: Promise<{
    boost?: string;
    target?: string;
    pack?: string;
    success?: string;
    subscription?: string;
    canceled?: string;
  }>;
};

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

  const initialBoost =
    resolvedSearchParams.boost === "event_boost"
      ? "event_boost"
      : undefined;

  const [promotions, subscription, events, feedPostCredits] = businessId
    ? await Promise.all([
        getBusinessPromotions(businessId, locale),
        getBusinessSubscription(businessId),
        getBusinessEvents(businessId, locale),
        getFeedPostCreditBalance(businessId),
      ])
    : [
        [],
        null,
        [],
        {
          premiumUsed: 0,
          premiumQuota: 0,
          packUsed: 0,
          packQuota: 0,
          remaining: 0,
        },
      ];

  return (
    <BusinessPromotionsPage
      promotions={promotions}
      subscription={subscription}
      events={events}
      feedPostCredits={feedPostCredits}
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
