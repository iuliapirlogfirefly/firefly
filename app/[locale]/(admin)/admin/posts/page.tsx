import { AdminPostsPage } from "@/components/admin/admin-posts-page";
import { redirect } from "@/i18n/navigation";
import {
  buildAdminQuery,
  emptyPage,
  firstSearchParam,
  parsePage,
  totalPages,
} from "@/lib/admin/pagination";
import {
  getAllAdminFeedPosts,
  getPendingFeedPostCount,
  getPendingFeedPosts,
  type AdminFeedPostListItem,
} from "@/lib/queries/feed";
import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminPostsRoutePage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const tab = firstSearchParam(sp.tab) === "all" ? "all" : "pending";
  const page = parsePage(sp.page);
  const q = firstSearchParam(sp.q);
  const status = firstSearchParam(sp.status) || "published";

  const pendingCount = await getPendingFeedPostCount();
  const pendingPosts =
    tab === "pending"
      ? await getPendingFeedPosts(locale, page)
      : emptyPage<AdminFeedPostListItem>(1);
  const allPosts =
    tab === "all"
      ? await getAllAdminFeedPosts(locale, { page, q, status })
      : emptyPage<AdminFeedPostListItem>(1);

  const current = tab === "pending" ? pendingPosts : allPosts;
  if (page > 1 && (current.total === 0 || page > totalPages(current.total))) {
    redirect({
      href: `/admin/posts${buildAdminQuery({
        tab: tab === "pending" ? undefined : tab,
        q: tab === "all" ? q : undefined,
        status: tab === "all" && status !== "published" ? status : undefined,
        page: current.total === 0 ? undefined : totalPages(current.total),
      })}`,
      locale,
    });
  }

  return (
    <AdminPostsPage
      tab={tab}
      q={q}
      status={status}
      pendingCount={pendingCount}
      pendingPosts={pendingPosts}
      allPosts={allPosts}
    />
  );
}
