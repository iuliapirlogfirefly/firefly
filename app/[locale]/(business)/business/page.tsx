import { setRequestLocale } from "next-intl/server";
import { BusinessDashboard } from "@/components/business/business-dashboard";
import {
  MOCK_BUSINESS_ACCOUNT_ID,
  getMockBusinessSession,
} from "@/lib/mocks/data";
import { getSession } from "@/lib/auth/session";
import { getBusinessAnalytics } from "@/lib/queries/analytics";
import { shouldUseMockData } from "@/lib/supabase/config";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export default async function BusinessDashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = shouldUseMockData()
    ? getMockBusinessSession()
    : await getSession();
  const businessId = shouldUseMockData()
    ? MOCK_BUSINESS_ACCOUNT_ID
    : session.businessAccountId;
  const analytics = businessId
    ? await getBusinessAnalytics(businessId, locale)
    : {
        views: 0,
        saves: 0,
        clicks: 0,
        ticketClicks: 0,
        shares: 0,
        totalEvents: 0,
        promotedEvents: 0,
        activePromotions: 0,
        events: [],
      };

  return (
    <BusinessDashboard
      analytics={analytics}
      venueName={session.displayName ?? "Your venue"}
    />
  );
}
