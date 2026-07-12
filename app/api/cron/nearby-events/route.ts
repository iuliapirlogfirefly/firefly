import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ sent: 0, skipped: "supabase_disabled" });
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { sendNearbyEventsDigestEmail } = await import(
    "@/lib/notifications/email"
  );
  const { getLocalizedField } = await import("@/lib/i18n/content");

  const admin = createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: subscribers, error } = await admin
    .from("profiles")
    .select(
      "id, preferred_locale, nearby_lat, nearby_lng, nearby_radius_km"
    )
    .eq("nearby_events_opt_in", true)
    .not("nearby_lat", "is", null)
    .not("nearby_lng", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;

  for (const subscriber of subscribers ?? []) {
    const lat = subscriber.nearby_lat!;
    const lng = subscriber.nearby_lng!;
    const radiusKm = subscriber.nearby_radius_km ?? 5;

    const { data: nearbyEvents, error: rpcError } = await admin.rpc(
      "events_within_distance",
      {
        p_lat: lat,
        p_lng: lng,
        p_distance_km: radiusKm,
      }
    );

    if (rpcError) continue;

    const recentEvents = (nearbyEvents ?? []).filter(
      (event) => event.updated_at >= since
    );

    if (recentEvents.length === 0) continue;

    const { data: alreadySent } = await admin
      .from("nearby_event_notifications")
      .select("event_id")
      .eq("user_id", subscriber.id);

    const sentIds = new Set((alreadySent ?? []).map((row) => row.event_id));
    const newEvents = recentEvents.filter((event) => !sentIds.has(event.id));

    if (newEvents.length === 0) continue;

    const { data: authUser } = await admin.auth.admin.getUserById(
      subscriber.id
    );
    if (!authUser?.user?.email) continue;

    const locale = (subscriber.preferred_locale as "en" | "ro") ?? "en";
    const digestEvents = newEvents.map((event) => ({
      title: getLocalizedField(
        event.translations as Parameters<typeof getLocalizedField>[0],
        locale,
        "title"
      ),
      startsAt: new Date(event.starts_at).toLocaleString(
        locale === "ro" ? "ro-RO" : "en-GB",
        { dateStyle: "medium", timeStyle: "short" }
      ),
      venueName: event.venue_name,
    }));

    await sendNearbyEventsDigestEmail(
      authUser.user.email,
      digestEvents,
      locale
    );

    await admin.from("nearby_event_notifications").insert(
      newEvents.map((event) => ({
        user_id: subscriber.id,
        event_id: event.id,
      }))
    );

    sent++;
  }

  return NextResponse.json({ sent });
}
