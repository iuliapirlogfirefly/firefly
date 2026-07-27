import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BusinessContact } from "@/components/business/business-contact";
import { MOCK_BUSINESS_ACCOUNT_ID } from "@/lib/mocks/data";
import { getSession } from "@/lib/auth/session";
import { getBusinessContactMessages } from "@/lib/queries/contact";
import { shouldUseMockData } from "@/lib/supabase/config";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export default async function BusinessContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  const businessId = shouldUseMockData()
    ? MOCK_BUSINESS_ACCOUNT_ID
    : session.businessAccountId;

  const messages = businessId
    ? await getBusinessContactMessages(businessId)
    : [];

  const supportEmail = process.env.SUPPORT_EMAIL?.trim() || null;
  const supportPhone = process.env.SUPPORT_PHONE?.trim() || null;

  return (
    <div data-route="business-contact">
      <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
        ◦ Business · Contact
      </div>
      <h1 className="font-heading text-4xl font-bold">
        Get in <span className="text-gradient-firefly">touch</span>
      </h1>
      <p className="mt-3 text-foreground/60">
        Need help with your venue or events? Message the Firefly team or reach
        us by email and phone.
      </p>

      {businessId ? (
        <BusinessContact
          supportEmail={supportEmail}
          supportPhone={supportPhone}
          messages={messages}
        />
      ) : (
        <div className="glass mt-8 rounded-2xl p-8 text-center">
          <p className="text-sm text-foreground/60">
            Register and get your business account approved to contact support.
          </p>
          <Link
            href="/business"
            className="mt-4 inline-flex rounded-full bg-firefly px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Go to business dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
