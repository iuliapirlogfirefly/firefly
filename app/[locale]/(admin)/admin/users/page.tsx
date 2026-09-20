import { AdminUsersPage } from "@/components/admin/admin-users-page";
import { redirect } from "@/i18n/navigation";
import {
  buildAdminQuery,
  firstSearchParam,
  parsePage,
  totalPages,
} from "@/lib/admin/pagination";
import {
  getAdminUserTabCounts,
  getAdminUsers,
  getPendingBusinessCount,
} from "@/lib/queries/users";
import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminUsersRoutePage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const tab = firstSearchParam(sp.tab) === "users" ? "users" : "businesses";
  const page = parsePage(sp.page);
  const q = firstSearchParam(sp.q);

  const [users, counts, pendingBusinesses] = await Promise.all([
    getAdminUsers({ tab, page, q }),
    getAdminUserTabCounts(),
    getPendingBusinessCount(),
  ]);

  if (page > 1 && (users.total === 0 || page > totalPages(users.total))) {
    redirect({
      href: `/admin/users${buildAdminQuery({
        tab: tab === "businesses" ? undefined : tab,
        q,
        page: users.total === 0 ? undefined : totalPages(users.total),
      })}`,
      locale,
    });
  }

  return (
    <AdminUsersPage
      tab={tab}
      q={q}
      users={users}
      businessCount={counts.businesses}
      userCount={counts.users}
      pendingBusinessCount={pendingBusinesses}
    />
  );
}
