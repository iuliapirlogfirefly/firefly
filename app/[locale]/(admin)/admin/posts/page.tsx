import { AdminPostsQueue } from "@/components/admin/admin-posts-queue";
import { getPendingFeedPosts } from "@/lib/queries/feed";
import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export default async function AdminPostsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const pendingPosts = await getPendingFeedPosts(locale);

  return <AdminPostsQueue posts={pendingPosts} locale={locale} />;
}
