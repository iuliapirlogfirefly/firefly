import { AdminNewsletterComposer } from "@/components/admin/admin-newsletter-composer";
import { getMockNewsletters } from "@/lib/mocks/data";
import { getNewsletterSubscribers } from "@/lib/queries/users";
import { shouldUseMockData } from "@/lib/supabase/config";
import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export default async function AdminNewslettersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [subscribers, archive] = await Promise.all([
    getNewsletterSubscribers(),
    Promise.resolve(getMockNewsletters()),
  ]);

  return (
    <AdminNewsletterComposer
      subscribers={subscribers}
      archive={archive}
      isMockMode={shouldUseMockData()}
    />
  );
}
