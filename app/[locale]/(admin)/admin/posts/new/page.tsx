import { AdminFeedPostForm } from "@/components/admin/admin-feed-post-form";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export default async function AdminNewPostPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  return (
    <div data-route="admin-posts-new">
      <h1 className="font-heading text-2xl font-semibold md:text-3xl">
        {t("createPost")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("createPostHint")}
      </p>
      <div className="mt-8">
        <AdminFeedPostForm />
      </div>
    </div>
  );
}
