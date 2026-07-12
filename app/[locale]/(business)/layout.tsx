import { BusinessShell } from "@/components/business/business-shell";
import { getMockBusinessSession } from "@/lib/mocks/data";
import { getSession } from "@/lib/auth/session";
import { shouldUseMockData } from "@/lib/supabase/config";

type Props = {
  children: React.ReactNode;
};

export default async function BusinessLayout({ children }: Props) {
  const session = shouldUseMockData()
    ? getMockBusinessSession()
    : await getSession();
  const venueName = session.displayName ?? "Your venue";

  return <BusinessShell venueName={venueName}>{children}</BusinessShell>;
}
