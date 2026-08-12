import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BusinessSettingsPage } from "@/components/business/business-settings-page";
import { MOCK_BUSINESS_ACCOUNT_ID } from "@/lib/mocks/data";
import { getSession } from "@/lib/auth/session";
import { getBusinessAccountInfo } from "@/lib/queries/business";
import { shouldUseMockData } from "@/lib/supabase/config";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export default async function BusinessSettingsRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  const businessId = shouldUseMockData()
    ? MOCK_BUSINESS_ACCOUNT_ID
    : session.businessAccountId;

  const account = businessId
    ? await getBusinessAccountInfo(businessId)
    : null;

  if (!businessId || !account) {
    return (
      <div data-route="business-settings">
        <div className="glass mt-8 rounded-2xl p-8 text-center">
          <p className="text-sm text-foreground/60">
            Register and get your business account approved to manage billing.
          </p>
          <Link
            href="/business"
            className="mt-4 inline-flex rounded-full bg-firefly px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Go to business dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <BusinessSettingsPage
      businessAccountId={account.id}
      businessName={account.name}
      initialBilling={account.billing}
    />
  );
}
