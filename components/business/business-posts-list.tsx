import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getCategoryMeta } from "@/lib/constants/feed-categories";
import { landingImages } from "@/lib/landing/images";
import type { BusinessFeedPostItem } from "@/lib/queries/feed";
import type { Locale } from "@/types";

type Props = {
  posts: BusinessFeedPostItem[];
  locale: Locale;
};

function statusClass(status: string) {
  if (status === "published") return "bg-firefly/10 text-firefly";
  if (status === "rejected") return "bg-destructive/15 text-destructive";
  return "bg-amber-warm/15 text-amber-warm";
}

export function BusinessPostsList({ posts, locale }: Props) {
  return (
    <ul className="mt-10 space-y-3">
      {posts.length === 0 ? (
        <li className="glass rounded-2xl p-8 text-center text-sm text-foreground/50">
          No posts yet — submit your first nightlife update.
        </li>
      ) : null}
      {posts.map((post) => {
        const category = getCategoryMeta(post.category, locale);
        return (
          <li key={post.id} className="glass rounded-2xl p-4">
            <div className="flex gap-4">
              {post.mediaUrl ? (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                  <Image
                    src={post.mediaUrl}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                  <Image
                    src={landingImages.editorialCrowd}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover opacity-60"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider-2 text-firefly">
                    {category.icon} {category.label}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider-2 ${statusClass(post.status)}`}
                  >
                    {post.status}
                  </span>
                </div>
                <div className="mt-1 font-heading font-semibold">{post.title}</div>
                <p className="mt-1 text-sm text-foreground/65">{post.description}</p>
                {post.status === "rejected" && post.rejectionReason ? (
                  <p className="mt-2 text-xs text-destructive">
                    Reason: {post.rejectionReason}
                  </p>
                ) : null}
              </div>
              {post.status === "published" ? (
                <Link
                  href={`/business/promotions?boost=feed_post&target=${post.id}`}
                  className="self-start rounded-full border border-firefly/30 px-3 py-1.5 text-xs text-firefly transition-colors hover:bg-firefly/10"
                >
                  Boost
                </Link>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
