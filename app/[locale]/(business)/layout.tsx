import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BusinessShell } from "@/components/business/business-shell";
import { getSession } from "@/lib/auth/session";
import { getMockBusinessSession } from "@/lib/mocks/data";
import { shouldUseMockData } from "@/lib/supabase/config";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

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
