import { AdminEventsPage } from "@/components/admin/admin-events-page";
import { redirect } from "@/i18n/navigation";
import {
  buildAdminQuery,
  emptyPage,
  firstSearchParam,
  parsePage,
  totalPages,
} from "@/lib/admin/pagination";
import {
  getAllAdminEvents,
  getPendingEventCount,
  getPendingEvents,
  type AdminEventRow,
  type AdminPendingEvent,
} from "@/lib/queries/events";
import { getDuplicateEventGroups, type DuplicateEventGroup } from "@/lib/queries/duplicates";
import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const TABS = ["pending", "all", "duplicates"] as const;
type Tab = (typeof TABS)[number];

export default async function AdminEventsRoutePage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const rawTab = firstSearchParam(sp.tab);
  const tab: Tab = TABS.includes(rawTab as Tab) ? (rawTab as Tab) : "pending";
  const page = parsePage(sp.page);
  const q = firstSearchParam(sp.q);
  const status = firstSearchParam(sp.status) || "all";

  const pendingCount = await getPendingEventCount();

  const pendingEvents =
    tab === "pending"
      ? await getPendingEvents(locale, page)
      : emptyPage<AdminPendingEvent>(1);
  const allEvents =
    tab === "all"
      ? await getAllAdminEvents(locale, { page, q, status })
      : emptyPage<AdminEventRow>(1);
  const duplicateGroups =
    tab === "duplicates"
      ? await getDuplicateEventGroups(locale, page)
      : emptyPage<DuplicateEventGroup>(1);

  const current =
    tab === "pending"
      ? pendingEvents
      : tab === "all"
        ? allEvents
        : duplicateGroups;

  if (page > 1 && (current.total === 0 || page > totalPages(current.total))) {
    redirect({
      href: `/admin/events${buildAdminQuery({
        tab: tab === "pending" ? undefined : tab,
        q: tab === "all" ? q : undefined,
        status: tab === "all" && status !== "all" ? status : undefined,
        page: current.total === 0 ? undefined : totalPages(current.total),
      })}`,
      locale,
    });
  }

  return (
    <AdminEventsPage
      tab={tab}
      q={q}
      status={status}
      pendingCount={pendingCount}
      pendingEvents={pendingEvents}
      allEvents={allEvents}
      duplicateGroups={duplicateGroups}
    />
  );
}
