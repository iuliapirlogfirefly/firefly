import { setRequestLocale, getTranslations } from "next-intl/server";
import { LegalDocumentView } from "@/components/legal/legal-document-view";
import { privacyContent } from "@/lib/legal/content/privacy";
import { generatePageMetadata } from "@/lib/seo/metadata";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const doc = privacyContent[locale];
  const intro = doc.blocks.find(
    (block): block is Extract<(typeof doc.blocks)[number], { type: "p" }> =>
      block.type === "p"
  );
  return generatePageMetadata(
    doc.title,
    intro?.text.slice(0, 140) ?? doc.title,
    locale,
    "/privacy"
  );
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");
  const doc = privacyContent[locale];

  return (
    <LegalDocumentView
      document={doc}
      lastUpdatedLabel={t("lastUpdatedLabel")}
      backHome={t("backHome")}
      metaLabels={{
        operator: t("operatorLabel"),
        contact: t("contactLabel"),
      }}
    />
  );
}
