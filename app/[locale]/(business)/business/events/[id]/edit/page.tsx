import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { BusinessEventForm } from "@/components/business/business-event-form";
import { MOCK_BUSINESS_ACCOUNT_ID } from "@/lib/mocks/data";
import { getSession } from "@/lib/auth/session";
import { getBusinessAccountInfo } from "@/lib/queries/business";
import { getBusinessEventForEdit } from "@/lib/queries/events";
import { shouldUseMockData } from "@/lib/supabase/config";

type Props = {
  params: Promise<{ locale: "en" | "ro"; id: string }>;
};

export default async function EditEventPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  const businessId = shouldUseMockData()
    ? MOCK_BUSINESS_ACCOUNT_ID
    : session.businessAccountId;

  if (!businessId) {
    redirect(`/${locale}/business`);
  }

  const [business, event] = await Promise.all([
    getBusinessAccountInfo(businessId),
    getBusinessEventForEdit(id, businessId, locale),
  ]);

  if (!business || !event) {
    notFound();
  }

  return (
    <div data-route="business-events-edit">
        <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
          ◦ Business · Edit event
        </div>
        <h1 className="mb-8 font-heading text-4xl font-bold">
          Edit <span className="text-gradient-firefly">event</span>
        </h1>

        <BusinessEventForm
          mode="edit"
          eventId={id}
          businessType={business.type}
          businessName={business.name}
          venue={business.venue}
          initial={event}
        />
    </div>
  );
}
