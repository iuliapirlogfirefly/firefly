import { SeoLandingPage } from "@/components/seo/seo-landing-page";
import {
  landingMetadata,
  settleHubLanding,
} from "@/lib/seo/load-landing";

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string; landing: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale, landing } = await params;
  const loaded = await settleHubLanding(locale, landing);
  return landingMetadata(loaded);
}

export default async function SeoHubRoute({ params }: Props) {
  const { locale, landing } = await params;
  const loaded = await settleHubLanding(locale, landing);
  return <SeoLandingPage loaded={loaded} />;
}
