"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AdminDeliveryActions } from "@/components/admin/admin-delivery-actions";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { AdminPagination } from "@/components/admin/ui/admin-pagination";
import { buildAdminQuery, type Paginated } from "@/lib/admin/pagination";
import type {
  AdminDeliveryRow,
  DeliveryStatusTab,
  DeliveryTypeFilter,
} from "@/lib/queries/promotions";

type Props = {
  deliveries: Paginated<AdminDeliveryRow>;
  status: DeliveryStatusTab;
  type: DeliveryTypeFilter;
  counts: { pending: number; done: number; all: number };
};

function truncate(text: string, max = 48) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

export function AdminDeliveriesTable({
  deliveries,
  status,
  type,
  counts,
}: Props) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const tProducts = useTranslations("common.products");
  const tStatus = useTranslations("common.status");

  const statusTabs = [
    ["pending", t("tabPending", { count: counts.pending })],
    ["done", t("tabDone", { count: counts.done })],
    ["all", t("tabAllCount", { count: counts.all })],
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
            <Link
              key={key}
              href={`/admin/deliveries${buildAdminQuery({
                tab: key === "pending" ? undefined : key,
                type: type === "all" ? undefined : type,
              })}`}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                status === key
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {typeFilters.map(([key, label]) => (
            <Link
              key={key}
              href={`/admin/deliveries${buildAdminQuery({
                tab: status === "pending" ? undefined : status,
                type: key === "all" ? undefined : key,
              })}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                type === key
                  ? "bg-surface-2 text-foreground"
                  : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {deliveries.items.length === 0 ? (
          <AdminEmptyState
            title={
              status === "pending" ? t("allCaughtUp") : t("nothingHere")
            }
            description={
              status === "pending"
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
                {deliveries.items.map((row) => {
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
        <AdminPagination
          pathname="/admin/deliveries"
          params={{
            tab: status === "pending" ? undefined : status,
            type: type === "all" ? undefined : type,
          }}
          page={deliveries.page}
          total={deliveries.total}
        />
      </div>

      {counts.pending > 0 && status !== "pending" ? (
        <AdminCard className="mt-6 border-amber-500/30 p-4">
          <p className="text-sm font-medium text-amber-400">
            {t("stillPending", { count: counts.pending })}
          </p>
        </AdminCard>
      ) : null}
    </div>
  );
}
