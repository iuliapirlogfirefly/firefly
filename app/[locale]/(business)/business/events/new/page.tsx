import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { BusinessEventForm } from "@/components/business/business-event-form";
import { MOCK_BUSINESS_ACCOUNT_ID } from "@/lib/mocks/data";
import { getSession } from "@/lib/auth/session";
import { getBusinessAccountInfo } from "@/lib/queries/business";
import { shouldUseMockData } from "@/lib/supabase/config";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export default async function NewEventPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  const businessId = shouldUseMockData()
    ? MOCK_BUSINESS_ACCOUNT_ID
    : session.businessAccountId;

  if (!businessId) {
    redirect(`/${locale}/business`);
  }

  const business = await getBusinessAccountInfo(businessId);

  if (!business) {
    redirect(`/${locale}/business`);
  }

  return (
    <div data-route="business-events-new">
        <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
          ◦ Business · New event
        </div>
        <h1 className="mb-8 font-heading text-4xl font-bold">
          Light up a <span className="text-gradient-firefly">new night</span>
        </h1>

        <BusinessEventForm
          mode="create"
          businessType={business.type}
          businessName={business.name}
          venue={business.venue}
        />
    </div>
  );
}
