"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AdminUserActions } from "@/components/admin/admin-user-actions";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminPagination } from "@/components/admin/ui/admin-pagination";
import { AdminSearchForm } from "@/components/admin/ui/admin-search-form";
import { buildAdminQuery, type Paginated } from "@/lib/admin/pagination";
import type { AdminUserRow } from "@/lib/queries/users";

type Tab = "businesses" | "users";

type Props = {
  tab: Tab;
  q: string;
  users: Paginated<AdminUserRow>;
  businessCount: number;
  userCount: number;
  pendingBusinessCount: number;
};

function isBusinessUser(user: AdminUserRow) {
  return (
    user.role === "business_venue" || user.role === "business_organizer"
  );
}

function tabClass(active: boolean) {
  return `border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
    active
      ? "border-foreground text-foreground"
      : "border-transparent text-muted-foreground hover:text-foreground"
  }`;
}

export function AdminUsersPage({
  tab,
  q,
  users,
  businessCount,
  userCount,
  pendingBusinessCount,
}: Props) {
  const t = useTranslations("admin");

  return (
    <div data-route="admin-users">
      <h1 className="font-heading text-2xl font-semibold md:text-3xl">
        {t("usersTitle")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("usersSubtitle")}
      </p>

      {pendingBusinessCount > 0 ? (
        <AdminCard className="mt-6 border-amber-500/30 p-4">
          <p className="text-sm font-medium text-amber-400">
            {t("pendingBanner", { count: pendingBusinessCount })}
          </p>
        </AdminCard>
      ) : null}

      <div className="mt-6 flex gap-2 border-b border-border">
        <Link href="/admin/users" className={tabClass(tab === "businesses")}>
          {t("tabBusinesses", { count: businessCount })}
        </Link>
        <Link
          href={`/admin/users${buildAdminQuery({ tab: "users" })}`}
          className={tabClass(tab === "users")}
        >
          {t("tabUsers", { count: userCount })}
        </Link>
      </div>

      <div className="mt-4">
        <AdminSearchForm
          q={q}
          placeholder={t("searchUsers")}
          hidden={{ tab: tab === "users" ? "users" : undefined }}
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-surface-1 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">{t("colName")}</th>
              <th className="px-4 py-3 font-medium">{t("colEmail")}</th>
              <th className="px-4 py-3 font-medium">{t("colRole")}</th>
              <th className="px-4 py-3 font-medium">{t("colStatus")}</th>
              <th className="px-4 py-3 font-medium">{t("colJoined")}</th>
              <th className="px-4 py-3 font-medium">{t("colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {users.items.map((user) => (
              <tr
                key={user.id}
                className="border-b border-border/50 hover:bg-surface-1/50"
              >
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {user.businessType ?? user.role.replace("_", " ")}
                </td>
                <td className="px-4 py-3">
                  <AdminBadge status={user.status as "pending"}>
                    {user.status}
                  </AdminBadge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {user.joinedAt}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {tab === "businesses" && user.businessAccountId ? (
                      <Link
                        href={`/admin/users/${user.businessAccountId}`}
                        className="inline-flex items-center justify-center rounded-lg border border-border bg-transparent px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-2"
                      >
                        {t("viewDetails")}
                      </Link>
                    ) : null}
                    <AdminUserActions
                      businessAccountId={user.businessAccountId}
                      userId={user.id}
                      status={user.status}
                      isBusiness={isBusinessUser(user)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AdminPagination
        pathname="/admin/users"
        params={{
          tab: tab === "users" ? "users" : undefined,
          q,
        }}
        page={users.page}
        total={users.total}
      />
    </div>
  );
}
