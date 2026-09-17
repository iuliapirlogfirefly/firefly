import { BusinessShell } from "@/components/business/business-shell";
import { getMockBusinessSession } from "@/lib/mocks/data";
import { getSession } from "@/lib/auth/session";
import { shouldUseMockData } from "@/lib/supabase/config";
import { getTranslations } from "next-intl/server";

type Props = {
  children: React.ReactNode;
};

export default async function BusinessLayout({ children }: Props) {
  const session = shouldUseMockData()
    ? getMockBusinessSession()
    : await getSession();
  const t = await getTranslations("common");
  const venueName = session.displayName ?? t("yourVenue");

  return <BusinessShell venueName={venueName}>{children}</BusinessShell>;
}
