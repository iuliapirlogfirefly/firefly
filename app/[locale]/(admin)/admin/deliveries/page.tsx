import { AdminDeliveriesTable } from "@/components/admin/admin-deliveries-table";
import { redirect } from "@/i18n/navigation";
import {
  buildAdminQuery,
  firstSearchParam,
  parsePage,
  totalPages,
} from "@/lib/admin/pagination";
import {
  getAdminDeliveries,
  getAdminDeliveryCounts,
  type DeliveryStatusTab,
  type DeliveryTypeFilter,
} from "@/lib/queries/promotions";
import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const STATUS_TABS: DeliveryStatusTab[] = ["pending", "done", "all"];
const TYPE_FILTERS: DeliveryTypeFilter[] = [
  "all",
  "social_media",
  "newsletter",
];

export default async function AdminDeliveriesPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const rawTab = firstSearchParam(sp.tab) as DeliveryStatusTab;
  const status: DeliveryStatusTab = STATUS_TABS.includes(rawTab)
    ? rawTab
    : "pending";
  const rawType = firstSearchParam(sp.type) as DeliveryTypeFilter;
  const type: DeliveryTypeFilter = TYPE_FILTERS.includes(rawType)
    ? rawType
    : "all";
  const page = parsePage(sp.page);

  const [deliveries, counts] = await Promise.all([
    getAdminDeliveries({ page, status, type }),
    getAdminDeliveryCounts(type),
  ]);

  if (page > 1 && (deliveries.total === 0 || page > totalPages(deliveries.total))) {
    redirect({
      href: `/admin/deliveries${buildAdminQuery({
        tab: status === "pending" ? undefined : status,
        type: type === "all" ? undefined : type,
        page: deliveries.total === 0 ? undefined : totalPages(deliveries.total),
      })}`,
      locale,
    });
  }

  return (
    <AdminDeliveriesTable
      deliveries={deliveries}
      status={status}
      type={type}
      counts={counts}
    />
  );
}
