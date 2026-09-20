import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AdminFeedPostForm } from "@/components/admin/admin-feed-post-form";
import { getAdminFeedPostDetail } from "@/lib/queries/feed";

type Props = {
  params: Promise<{ locale: "en" | "ro"; id: string }>;
};

export default async function AdminEditPostPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const post = await getAdminFeedPostDetail(id);
  if (!post) notFound();

  const t = await getTranslations("admin");
  const title =
    post.translations.en.title ||
    post.translations.ro?.title ||
    t("untitledPost");

  return (
    <div data-route="admin-posts-edit">
      <div className="mb-2">
        <Link
          href={`/admin/posts/${post.id}`}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {t("backPosts")}
        </Link>
      </div>
      <h1 className="font-heading text-2xl font-semibold md:text-3xl">
        {t("editPost")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{t("editPostHint")}</p>
      <div className="mt-8">
        <AdminFeedPostForm post={post} />
      </div>
    </div>
  );
}
