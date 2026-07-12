import { EventForm } from "@/components/events/event-form";
import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export default async function AdminNewEventPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div data-route="admin-events-new">
      <h1 className="font-heading text-2xl font-semibold md:text-3xl">
        Create event
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Admin events publish immediately without approval.
      </p>
      <div className="mt-8">
        <EventForm mode="create" />
      </div>
    </div>
  );
}
