"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BusinessDeleteButton } from "@/components/business/business-delete-button";
import { getCategoryMeta } from "@/lib/constants/feed-categories";
import { landingImages } from "@/lib/landing/images";
import type { BusinessFeedPostItem } from "@/lib/queries/feed";

type Props = {
  posts: BusinessFeedPostItem[];
};

function statusClass(status: string) {
  if (status === "published") return "bg-firefly/10 text-firefly";
  if (status === "rejected") return "bg-destructive/15 text-destructive";
  return "bg-amber-warm/15 text-amber-warm";
}

export function BusinessPostsList({ posts }: Props) {
  const t = useTranslations("business");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("common.status");
  const tCategories = useTranslations("feedCategories");

  return (
    <ul className="mt-10 space-y-3">
      {posts.length === 0 ? (
        <li className="glass rounded-2xl p-8 text-center text-sm text-foreground/50">
          {t("emptyPosts")}
        </li>
      ) : null}
      {posts.map((post) => {
        const category = getCategoryMeta(post.category, tCategories);
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
                    {tStatus(post.status)}
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
              <div className="flex shrink-0 flex-col gap-2 self-start">
                <Link
                  href={`/business/posts/${post.id}/edit`}
                  className="rounded-full border border-firefly/30 px-3 py-1.5 text-xs text-firefly transition-colors hover:bg-firefly/10"
                >
                  {tCommon("edit")}
                </Link>
                <BusinessDeleteButton
                  kind="post"
                  id={post.id}
                  isLive={post.status === "published"}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
