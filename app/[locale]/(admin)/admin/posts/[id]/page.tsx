import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { AdminPostDetailsPage } from "@/components/admin/admin-post-details-page";
import { getAdminFeedPostDetail } from "@/lib/queries/feed";

type Props = {
  params: Promise<{ locale: "en" | "ro"; id: string }>;
};

export default async function AdminPostDetailsRoute({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const post = await getAdminFeedPostDetail(id);
  if (!post) notFound();

  return <AdminPostDetailsPage post={post} />;
}
