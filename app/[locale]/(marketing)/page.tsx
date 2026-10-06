import { setRequestLocale, getTranslations } from "next-intl/server";
import { HomePage } from "@/components/landing/home-page";
import { generatePageMetadata } from "@/lib/seo/metadata";
import { isPrelaunchActive } from "@/lib/launch/settings";

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
  const t = await getTranslations({ locale, namespace: "seo" });
  return generatePageMetadata(
    t("homeTitle"),
    t("homeDescription"),
    locale,
    "/"
  );
}

export default async function LandingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomePage />;
}
