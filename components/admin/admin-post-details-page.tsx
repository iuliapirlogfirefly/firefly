import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AdminPostActions } from "@/components/admin/admin-post-actions";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { getCategoryMeta } from "@/lib/constants/feed-categories";
import { dateTimeLocale } from "@/lib/i18n/date-locale";
import { landingImages } from "@/lib/landing/images";
import type { AdminFeedPostDetail } from "@/lib/queries/feed";
import {
  MISSED_POST_CATEGORIES,
  MISSED_WINDOW_HOURS,
  isWithinMissedWindow,
} from "@/lib/utils/feed-filters";

type Props = {
  post: AdminFeedPostDetail;
};

function TranslationBlock({
  localeLabel,
  title,
  description,
  missing,
}: {
  localeLabel: string;
  title?: string;
  description?: string;
  missing: string;
}) {
  const hasContent = Boolean(title || description);

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {localeLabel}
      </p>
      {hasContent ? (
        <>
          <h3 className="mt-1 font-medium">{title || "—"}</h3>
          <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
            {description || "—"}
          </p>
        </>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">{missing}</p>
      )}
    </div>
  );
}

export async function AdminPostDetailsPage({ post }: Props) {
  const t = await getTranslations("admin");
  const tCategories = await getTranslations("feedCategories");
  const locale = await getLocale();
  const category = getCategoryMeta(post.category, tCategories);
  const title =
    post.translations.en.title ||
    post.translations.ro?.title ||
    t("untitledPost");
  const showsOnMissed = MISSED_POST_CATEGORIES.includes(post.category);
  const liveOnMissed =
    post.status === "published" &&
    !!post.publishedAt &&
    isWithinMissedWindow(post.publishedAt);
  const submittedAt = new Intl.DateTimeFormat(dateTimeLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(post.createdAt));
  const publishedAt = post.publishedAt
    ? new Intl.DateTimeFormat(dateTimeLocale(locale), {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(post.publishedAt))
    : null;

  return (
    <div data-route="admin-post-details">
      <div className="mb-2">
        <Link
          href="/admin/posts"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {t("backPosts")}
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <AdminBadge status={post.status}>{post.status}</AdminBadge>
            {liveOnMissed ? (
              <span className="inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
                {t("liveOnMissed")}
              </span>
            ) : null}
            <span className="text-xs text-muted-foreground">
              {category.icon} {category.label}
            </span>
          </div>
          <h1 className="mt-2 font-heading text-2xl font-semibold md:text-3xl">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("submittedDate", { date: submittedAt })}
          </p>
          {publishedAt ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {t("publishedDate", { date: publishedAt })}
            </p>
          ) : null}
          {post.businessAccountId ? (
            <p className="mt-1 text-sm">
              <Link
                href={`/admin/users/${post.businessAccountId}`}
                className="underline-offset-2 hover:underline"
              >
                {post.businessName ?? t("unknownBusiness")}
              </Link>
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              {t("noBusiness")}
            </p>
          )}
        </div>
        <AdminPostActions postId={post.id} status={post.status} />
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {showsOnMissed
          ? t("showsOnMissed", { hours: MISSED_WINDOW_HOURS })
          : t("hiddenFromMissed")}
      </p>

      {post.rejectionReason ? (
        <p className="mt-2 text-sm text-red-400">
          {t("rejectionReason", { reason: post.rejectionReason })}
        </p>
      ) : null}

      <AdminCard className="relative mt-6 overflow-hidden">
        <div className="relative aspect-[4/5] w-full max-w-md">
          <Image
            src={post.mediaUrl ?? landingImages.editorialStreet}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 448px"
            className="object-cover"
            priority
          />
        </div>
      </AdminCard>

      <AdminCard className="mt-6 space-y-6 p-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {t("translations")}
        </h2>
        <TranslationBlock
          localeLabel="EN"
          title={post.translations.en.title}
          description={post.translations.en.description}
          missing={t("noTranslation", { locale: "EN" })}
        />
        <TranslationBlock
          localeLabel="RO"
          title={post.translations.ro?.title}
          description={post.translations.ro?.description}
          missing={t("noTranslation", { locale: "RO" })}
        />
      </AdminCard>
    </div>
  );
}
