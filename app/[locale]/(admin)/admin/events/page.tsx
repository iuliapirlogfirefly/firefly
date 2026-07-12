import { AdminEventsPage } from "@/components/admin/admin-events-page";
import { getDuplicateEventGroups } from "@/lib/queries/duplicates";
import { getAllAdminEvents, getPendingEvents } from "@/lib/queries/events";
import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export default async function AdminEventsRoutePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [pendingEvents, allEvents, duplicateGroups] = await Promise.all([
    getPendingEvents(locale),
    getAllAdminEvents(locale),
    getDuplicateEventGroups(locale),
  ]);

  return (
    <AdminEventsPage
      pendingEvents={pendingEvents}
      allEvents={allEvents}
      duplicateGroups={duplicateGroups}
    />
  );
}
