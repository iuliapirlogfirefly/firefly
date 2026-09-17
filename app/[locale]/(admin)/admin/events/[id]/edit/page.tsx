import { EventForm } from "@/components/events/event-form";
import { getAdminEventForEdit } from "@/lib/queries/events";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: "en" | "ro"; id: string }>;
};

export default async function AdminEditEventPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const event = await getAdminEventForEdit(id, locale);
  if (!event) notFound();

  const { id: eventId, status: _status, ...initial } = event;

  return (
    <div data-route="admin-events-edit">
      <div className="mb-2">
        <Link
          href={`/admin/events/${eventId}`}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Event details
        </Link>
      </div>
      <h1 className="font-heading text-2xl font-semibold md:text-3xl">
        Edit event
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{event.translations.en.title}</p>
      <div className="mt-8">
        <EventForm mode="edit" eventId={eventId} initial={initial} />
      </div>
    </div>
  );
}
