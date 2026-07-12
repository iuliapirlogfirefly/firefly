import { AdminNewsletterComposer } from "@/components/admin/admin-newsletter-composer";
import { getMockNewsletters } from "@/lib/mocks/data";
import { getNewsletterSubscriberCount } from "@/lib/queries/users";
import { shouldUseMockData } from "@/lib/supabase/config";
import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export default async function AdminNewslettersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [subscriberCount, archive] = await Promise.all([
    getNewsletterSubscriberCount(),
    Promise.resolve(getMockNewsletters()),
  ]);

  return (
    <AdminNewsletterComposer
      subscriberCount={subscriberCount}
      archive={archive}
      isMockMode={shouldUseMockData()}
    />
  );
}
