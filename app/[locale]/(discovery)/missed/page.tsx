import { setRequestLocale } from "next-intl/server";
import { MissedPageClient } from "@/components/missed/missed-page";
import { getMissedPosts } from "@/lib/queries/feed";
import { generatePageMetadata } from "@/lib/seo/metadata";

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return generatePageMetadata(
    "What you did missed",
    "Recent nightlife posts — party updates and chaos.",
    locale,
    "/missed"
  );
}

export default async function MissedPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const posts = await getMissedPosts(locale, 30);

  return <MissedPageClient posts={posts} locale={locale} />;
}
