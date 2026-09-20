"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AdminPostActions } from "@/components/admin/admin-post-actions";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { AdminPagination } from "@/components/admin/ui/admin-pagination";
import { AdminSearchForm } from "@/components/admin/ui/admin-search-form";
import { buildAdminQuery, type Paginated } from "@/lib/admin/pagination";
import { getCategoryMeta } from "@/lib/constants/feed-categories";
import { dateTimeLocale } from "@/lib/i18n/date-locale";
import { landingImages } from "@/lib/landing/images";
import type { AdminFeedPostListItem } from "@/lib/queries/feed";
import { isWithinMissedWindow } from "@/lib/utils/feed-filters";

type Props = {
  tab: Tab;
  q: string;
  status: string;
  pendingCount: number;
  pendingPosts: Paginated<AdminFeedPostListItem>;
  allPosts: Paginated<AdminFeedPostListItem>;
};

type Tab = "pending" | "all";

const STATUS_OPTIONS = [
  "published",
  "pending",
  "draft",
  "rejected",
  "approved",
] as const;

function formatPostDate(iso: string, locale: string) {
  return new Intl.DateTimeFormat(dateTimeLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function isLiveOnMissed(post: AdminFeedPostListItem) {
  return (
    post.status === "published" &&
    !!post.publishedAt &&
    isWithinMissedWindow(post.publishedAt)
  );
}

function PostCard({
  post,
  compact,
}: {
  post: AdminFeedPostListItem;
  compact?: boolean;
}) {
  const t = useTranslations("admin");
  const tCategories = useTranslations("feedCategories");
  const locale = useLocale();
  const category = getCategoryMeta(post.category, tCategories);
  const live = isLiveOnMissed(post);

  return (
    <AdminCard className="p-5">
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
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {category.icon} {category.label}
            </span>
            <AdminBadge status={post.status}>{post.status}</AdminBadge>
            {live ? (
              <span className="inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
                {t("liveOnMissed")}
              </span>
            ) : null}
          </div>
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
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("noBusiness")}
            </p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">{post.description}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {post.status === "published" && post.publishedAt
              ? t("publishedDate", {
                  date: formatPostDate(post.publishedAt, locale),
                })
              : t("submittedDate", {
                  date: formatPostDate(post.createdAt, locale),
                })}
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
        <AdminPostActions
          postId={post.id}
          status={post.status}
          compact={compact}
        />
      </div>
    </AdminCard>
  );
}

export function AdminPostsPage({
  tab,
  q,
  status,
  pendingCount,
  pendingPosts,
  allPosts,
}: Props) {
  const t = useTranslations("admin");
  const tStatus = useTranslations("common.status");

  return (
    <div data-route="admin-posts">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold md:text-3xl">
            {t("postsTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tab === "pending"
              ? t("postsSubtitle", { count: pendingCount })
              : t("postsManageSubtitle")}
          </p>
        </div>
        <Link href="/admin/posts/new">
          <AdminButton size="md">{t("createPost")}</AdminButton>
        </Link>
      </div>

      <div className="mt-6 flex gap-2 border-b border-border">
        <Link
          href="/admin/posts"
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            tab === "pending"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("tabPending", { count: pendingCount })}
        </Link>
        <Link
          href={`/admin/posts${buildAdminQuery({ tab: "all" })}`}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            tab === "all"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("tabAllPosts")}
        </Link>
      </div>

      {tab === "pending" ? (
        <div className="mt-6 space-y-4">
          {pendingPosts.items.length === 0 ? (
            <AdminEmptyState
              title={t("allCaughtUp")}
              description={t("noPendingPosts")}
            />
          ) : (
            pendingPosts.items.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          )}
          <AdminPagination
            pathname="/admin/posts"
            page={pendingPosts.page}
            total={pendingPosts.total}
          />
        </div>
      ) : null}

      {tab === "all" ? (
        <div className="mt-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <AdminSearchForm
              q={q}
              placeholder={t("searchPosts")}
              hidden={{
                tab: "all",
                status: status !== "published" ? status : undefined,
              }}
            />
            <form method="get">
              <input type="hidden" name="tab" value="all" />
              {q ? <input type="hidden" name="q" value={q} /> : null}
              <select
                name="status"
                defaultValue={status}
                onChange={(event) => event.currentTarget.form?.requestSubmit()}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
              >
                <option value="all">{t("allStatuses")}</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {tStatus(option)}
                  </option>
                ))}
              </select>
            </form>
          </div>

          {allPosts.items.length === 0 ? (
            <AdminEmptyState
              title={t("nothingHere")}
              description={
                status === "published" && !q
                  ? t("noPublishedPosts")
                  : t("noPostsMatch")
              }
            />
          ) : (
            <div className="space-y-4">
              {allPosts.items.map((post) => (
                <PostCard key={post.id} post={post} compact />
              ))}
            </div>
          )}
          <AdminPagination
            pathname="/admin/posts"
            params={{
              tab: "all",
              q,
              status: status !== "published" ? status : undefined,
            }}
            page={allPosts.page}
            total={allPosts.total}
          />
        </div>
      ) : null}
    </div>
  );
}
