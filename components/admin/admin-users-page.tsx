"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { AdminUserActions } from "@/components/admin/admin-user-actions";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { AdminCard } from "@/components/admin/ui/admin-card";
import type { AdminUserRow } from "@/lib/queries/users";

type Props = {
  users: AdminUserRow[];
};

type Tab = "businesses" | "users";

function isBusinessUser(user: AdminUserRow) {
  return (
    user.role === "business_venue" || user.role === "business_organizer"
  );
}

export function AdminUsersPage({ users }: Props) {
  const [tab, setTab] = useState<Tab>("businesses");
  const [search, setSearch] = useState("");

  const businesses = useMemo(
    () => users.filter(isBusinessUser),
    [users]
  );
  const standardUsers = useMemo(
    () => users.filter((u) => !isBusinessUser(u)),
    [users]
  );

  const pendingBusinesses = businesses.filter((b) => b.status === "pending");
  const list = tab === "businesses" ? businesses : standardUsers;

  const filtered = useMemo(() => {
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [list, search]);

  return (
    <div data-route="admin-users">
      <h1 className="font-heading text-2xl font-semibold md:text-3xl">
        Users & businesses
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage business account approvals and user access.
      </p>

      {pendingBusinesses.length > 0 ? (
        <AdminCard className="mt-6 border-amber-500/30 p-4">
          <p className="text-sm font-medium text-amber-400">
            {pendingBusinesses.length} business account
            {pendingBusinesses.length === 1 ? "" : "s"} awaiting approval
          </p>
        </AdminCard>
      ) : null}

      <div className="mt-6 flex gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setTab("businesses")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            tab === "businesses"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Businesses ({businesses.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("users")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            tab === "users"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Users ({standardUsers.length})
        </button>
      </div>

      <div className="mt-4">
        <input
          type="search"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-foreground/30"
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-surface-1 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
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
                        View details
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
    </div>
  );
}
