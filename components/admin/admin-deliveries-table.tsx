"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AdminDeliveryActions } from "@/components/admin/admin-delivery-actions";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import type { AdminDeliveryRow } from "@/lib/queries/promotions";

type Props = {
  deliveries: AdminDeliveryRow[];
};

type StatusTab = "pending" | "done" | "all";
type TypeFilter = "all" | "social_media" | "newsletter";

function truncate(text: string, max = 48) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

export function AdminDeliveriesTable({ deliveries }: Props) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const tProducts = useTranslations("common.products");
  const tStatus = useTranslations("common.status");
  const [statusTab, setStatusTab] = useState<StatusTab>("pending");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const pendingCount = deliveries.filter((d) => !d.fulfilledAt).length;
  const doneCount = deliveries.filter((d) => d.fulfilledAt).length;

  const filtered = useMemo(() => {
    return deliveries.filter((d) => {
      if (statusTab === "pending" && d.fulfilledAt) return false;
      if (statusTab === "done" && !d.fulfilledAt) return false;
      if (typeFilter !== "all" && d.type !== typeFilter) return false;
      return true;
    });
  }, [deliveries, statusTab, typeFilter]);

  const statusTabs = [
    ["pending", t("tabPending", { count: pendingCount })],
    ["done", t("tabDone", { count: doneCount })],
    ["all", t("tabAllCount", { count: deliveries.length })],
  ] as const;

  const typeFilters = [
    ["all", t("filterAllTypes")],
    ["social_media", t("filterSocial")],
    ["newsletter", t("filterNewsletter")],
  ] as const;

  return (
    <div data-route="admin-deliveries">
      <h1 className="font-heading text-2xl font-semibold md:text-3xl">
        {t("deliveries")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("deliveriesSubtitle")}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <div className="flex gap-2 border-b border-border">
          {statusTabs.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusTab(key)}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                statusTab === key
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {typeFilters.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTypeFilter(key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                typeFilter === key
                  ? "bg-surface-2 text-foreground"
                  : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {filtered.length === 0 ? (
          <AdminEmptyState
            title={
              statusTab === "pending" ? t("allCaughtUp") : t("nothingHere")
            }
            description={
              statusTab === "pending"
                ? t("noPendingDeliveries")
                : t("noDeliveriesMatch")
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-border bg-surface-1 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("colBusiness")}</th>
                  <th className="px-4 py-3 font-medium">{t("colType")}</th>
                  <th className="px-4 py-3 font-medium">{t("colCreated")}</th>
                  <th className="px-4 py-3 font-medium">{t("colExpires")}</th>
                  <th className="px-4 py-3 font-medium">{t("colStatus")}</th>
                  <th className="px-4 py-3 font-medium">{t("colUrl")}</th>
                  <th className="px-4 py-3 font-medium">{t("colNotes")}</th>
                  <th className="px-4 py-3 font-medium">{t("colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const done = Boolean(row.fulfilledAt);
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-border/50 hover:bg-surface-1/50"
                    >
                      <td className="px-4 py-3 font-medium">
                        {row.businessName}
                      </td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">
                        {tProducts.has(row.type)
                          ? tProducts(row.type)
                          : row.type.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.createdAt.slice(0, 10)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.expiresAt}
                      </td>
                      <td className="px-4 py-3">
                        <AdminBadge status={done ? "approved" : "pending"}>
                          {done ? tCommon("done") : tStatus("pending")}
                        </AdminBadge>
                      </td>
                      <td className="max-w-[180px] px-4 py-3">
                        {row.deliveryUrl ? (
                          <a
                            href={row.deliveryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="break-all text-sm text-foreground underline-offset-2 hover:underline"
                          >
                            {truncate(row.deliveryUrl, 36)}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="max-w-[200px] px-4 py-3 text-muted-foreground">
                        {row.deliveryNotes
                          ? truncate(row.deliveryNotes)
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <AdminDeliveryActions
                          promotionId={row.id}
                          fulfilled={done}
                          deliveryUrl={row.deliveryUrl}
                          deliveryNotes={row.deliveryNotes}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pendingCount > 0 && statusTab !== "pending" ? (
        <AdminCard className="mt-6 border-amber-500/30 p-4">
          <p className="text-sm font-medium text-amber-400">
            {t("stillPending", { count: pendingCount })}
          </p>
        </AdminCard>
      ) : null}
    </div>
  );
}
