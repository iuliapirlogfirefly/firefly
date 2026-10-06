import { SeoLandingPage } from "@/components/seo/seo-landing-page";
import {
  landingMetadata,
  settleFacetLanding,
} from "@/lib/seo/load-landing";

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string; landing: string; slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale, landing, slug } = await params;
  const loaded = await settleFacetLanding(locale, landing, slug);
  return landingMetadata(loaded);
}

export default async function SeoFacetRoute({ params }: Props) {
  const { locale, landing, slug } = await params;
  const loaded = await settleFacetLanding(locale, landing, slug);
  return <SeoLandingPage loaded={loaded} />;
}
