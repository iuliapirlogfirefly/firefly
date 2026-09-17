import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCategoryMeta } from "@/lib/constants/feed-categories";
import { AdminPostActions } from "@/components/admin/admin-post-actions";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { landingImages } from "@/lib/landing/images";
import type { FeedPostItem } from "@/lib/queries/feed";

type PendingPost = FeedPostItem & {
  status: string;
  rejectionReason: string | null;
  businessName?: string | null;
};

type Props = {
  posts: PendingPost[];
};

export async function AdminPostsQueue({ posts }: Props) {
  const t = await getTranslations("admin");
  const tCategories = await getTranslations("feedCategories");

  return (
    <div data-route="admin-posts">
      <h1 className="font-heading text-2xl font-semibold md:text-3xl">
        {t("postsTitle")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("postsSubtitle", { count: posts.length })}
      </p>

      <div className="mt-6 space-y-4">
        {posts.length === 0 ? (
          <AdminEmptyState
            title={t("allCaughtUp")}
            description={t("noPendingPosts")}
          />
        ) : (
          posts.map((post) => {
            const category = getCategoryMeta(post.category, tCategories);

            return (
              <AdminCard key={post.id} className="p-5">
                <div className="flex gap-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={post.mediaUrl ?? landingImages.editorialStreet}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs text-muted-foreground">
                      {category.icon} {category.label}
                    </span>
                    <h2 className="mt-1 font-medium">
                      <Link
                        href={`/admin/posts/${post.id}`}
                        className="hover:underline"
                      >
                        {post.title}
                      </Link>
                    </h2>
                    {post.businessName ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {post.businessName}
                      </p>
                    ) : null}
                    <p className="mt-1 text-sm text-muted-foreground">
                      {post.description}
                    </p>
                    <Link
                      href={`/admin/posts/${post.id}`}
                      className="mt-2 inline-block text-sm text-foreground underline-offset-2 hover:underline"
                    >
                      {t("viewDetails")}
                    </Link>
                  </div>
                </div>
                <div className="mt-4">
                  <AdminPostActions postId={post.id} status={post.status} />
                </div>
              </AdminCard>
            );
          })
        )}
      </div>
    </div>
  );
}
