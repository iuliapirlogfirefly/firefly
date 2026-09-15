import Image from "next/image";
import { getCategoryMeta } from "@/lib/constants/feed-categories";
import { AdminPostActions } from "@/components/admin/admin-post-actions";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { landingImages } from "@/lib/landing/images";
import type { FeedPostItem } from "@/lib/queries/feed";
import type { Locale } from "@/types";

type PendingPost = FeedPostItem & {
  status: string;
  rejectionReason: string | null;
};

type Props = {
  posts: PendingPost[];
  locale: Locale;
};

export function AdminPostsQueue({ posts, locale }: Props) {
  return (
    <div data-route="admin-posts">
      <h1 className="font-heading text-2xl font-semibold md:text-3xl">
        What Did You Miss posts
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {posts.length} post{posts.length === 1 ? "" : "s"} waiting for review.
      </p>

      <div className="mt-6 space-y-4">
        {posts.length === 0 ? (
          <AdminEmptyState
            title="All caught up"
            description="No What Did You Miss posts waiting for review."
          />
        ) : (
          posts.map((post) => {
            const category = getCategoryMeta(post.category, locale);

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
                    <h2 className="mt-1 font-medium">{post.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {post.description}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <AdminPostActions postId={post.id} />
                </div>
              </AdminCard>
            );
          })
        )}
      </div>
    </div>
  );
}
