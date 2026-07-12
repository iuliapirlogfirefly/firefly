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
  const businessId = session.businessAccountId ?? MOCK_BUSINESS_ACCOUNT_ID;
  const analytics = await getBusinessAnalytics(businessId);

  return (
    <BusinessDashboard
      analytics={analytics}
      venueName={session.displayName ?? "Your venue"}
    />
  );
}
