import { setRequestLocale } from "next-intl/server";
import { BusinessEventsList } from "@/components/business/business-events-list";
import { MOCK_BUSINESS_ACCOUNT_ID } from "@/lib/mocks/data";
import { getSession } from "@/lib/auth/session";
import { getBusinessEvents } from "@/lib/queries/events";
import { shouldUseMockData } from "@/lib/supabase/config";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export default async function BusinessEventsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  const businessId = shouldUseMockData()
    ? MOCK_BUSINESS_ACCOUNT_ID
    : session.businessAccountId;

  const events = businessId
    ? await getBusinessEvents(businessId, locale)
    : [];

  return <BusinessEventsList events={events} />;
}
