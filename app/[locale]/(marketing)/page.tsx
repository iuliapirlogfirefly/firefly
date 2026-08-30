import { setRequestLocale, getTranslations } from "next-intl/server";
import { HomePage } from "@/components/landing/home-page";
import { isPrelaunchActive } from "@/lib/launch/settings";
import { generatePageMetadata } from "@/lib/seo/metadata";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (await isPrelaunchActive()) {
    const t = await getTranslations({ locale, namespace: "prelaunch" });
    return generatePageMetadata(
      t("metaTitle"),
      t("metaDescription"),
      locale,
      "/"
    );
  }
  return generatePageMetadata(
    "Discover Bucharest Nightlife",
    "Find live and upcoming parties in Bucharest",
    locale,
    "/"
  );
}

export default async function LandingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomePage />;
}
