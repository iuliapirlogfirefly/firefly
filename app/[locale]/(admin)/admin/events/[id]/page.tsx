import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { AdminEventDetailsPage } from "@/components/admin/admin-event-details-page";
import { getAdminEventDetail } from "@/lib/queries/events";

type Props = {
  params: Promise<{ locale: "en" | "ro"; id: string }>;
};

export default async function AdminEventDetailsRoute({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const event = await getAdminEventDetail(id);
  if (!event) notFound();

  return <AdminEventDetailsPage event={event} />;
}
