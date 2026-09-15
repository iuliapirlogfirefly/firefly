"use client";

import { useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { createEvent, updateEvent } from "@/lib/actions/events";
import { GENRES, formatGenreLabel } from "@/lib/constants/genres";
import { EVENT_TYPES, formatEventTypeLabel } from "@/lib/constants/event-types";
import { ImageUploader } from "@/components/events/image-uploader";
import { LocationMapPicker } from "@/components/business/location-map-picker";
import { BUCHAREST_CENTER } from "@/lib/utils/map-coords";
import type { CreateEventInput } from "@/types/events";
import type { EventType, Genre } from "@/types";

type BusinessVenue = {
  name: string;
  address: string;
  lat: number;
  lng: number;
} | null;

type Props = {
  mode: "create" | "edit";
  eventId?: string;
  businessType: "venue" | "organizer";
  venue: BusinessVenue;
  initial?: Partial<CreateEventInput> & {
    status?: string;
    rejectionReason?: string | null;
  };
};

const inputClass =
  "w-full rounded-xl border border-firefly/20 bg-surface-1/50 px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-firefly/50";

const labelClass = "mb-1.5 block text-xs font-medium text-foreground/50";

function StatusNote({
  status,
  rejectionReason,
}: {
  status?: string;
  rejectionReason?: string | null;
}) {
  if (!status || status === "draft") {
    return (
      <p className="text-xs text-foreground/50">
        This event is a draft. Save it, then submit it for admin approval
        when it&apos;s ready — nothing goes live until it&apos;s approved.
      </p>
    );
  }
  if (status === "pending") {
    return (
      <p className="text-xs text-amber-warm">
        This event is awaiting admin approval. You can still edit it, but
        it&apos;ll need to be resubmitted after changes.
      </p>
    );
  }
  if (status === "rejected") {
    return (
      <p className="text-xs text-destructive">
        This event was rejected
        {rejectionReason ? `: ${rejectionReason}` : "."} Update it and
        submit it again.
      </p>
    );
  }
  if (status === "published") {
    return (
      <p className="text-xs text-firefly">
        This event is live. Editing a published event isn&apos;t supported
        yet — contact an admin for changes.
      </p>
    );
  }
  return null;
}

export function BusinessEventForm({
  mode,
  eventId,
  businessType,
  venue,
  initial,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [submitIntent, setSubmitIntent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);

  const editable =
    mode === "create" || !initial?.status || ["draft", "rejected"].includes(initial.status);
  const locked = !editable || saving;

  const [titleEn, setTitleEn] = useState(initial?.translations?.en?.title ?? "");
  const [descEn, setDescEn] = useState(initial?.translations?.en?.description ?? "");
  const [titleRo, setTitleRo] = useState(initial?.translations?.ro?.title ?? "");
  const [descRo, setDescRo] = useState(initial?.translations?.ro?.description ?? "");
  const [startsAt, setStartsAt] = useState(initial?.startsAt?.slice(0, 16) ?? "");
  const [endsAt, setEndsAt] = useState(initial?.endsAt?.slice(0, 16) ?? "");
  const [genre, setGenre] = useState<Genre>(initial?.genre ?? "techno");
  const [eventType, setEventType] = useState<EventType>(
    initial?.eventType ?? "party"
  );
  const [price, setPrice] = useState(
    initial?.price != null ? String(initial.price) : ""
  );
  const [ticketUrl, setTicketUrl] = useState(initial?.ticketUrl ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(initial?.websiteUrl ?? "");
  const [specialGuest, setSpecialGuest] = useState(initial?.specialGuest ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    initial?.coverImageUrl ?? null
  );
  const [images, setImages] = useState<string[]>(initial?.images ?? []);

  // Location via map pin (admin/organizer/venue); lat/lng not shown in UI
  const [venueName, setVenueName] = useState(
    initial?.venueName ?? venue?.name ?? ""
  );
  const [address, setAddress] = useState(
    initial?.address ?? venue?.address ?? ""
  );
  const [lat, setLat] = useState(
    initial?.lat != null && Number.isFinite(initial.lat)
      ? initial.lat
      : venue?.lat != null && Number.isFinite(venue.lat)
        ? venue.lat
        : BUCHAREST_CENTER.lat
  );
  const [lng, setLng] = useState(
    initial?.lng != null && Number.isFinite(initial.lng)
      ? initial.lng
      : venue?.lng != null && Number.isFinite(venue.lng)
        ? venue.lng
        : BUCHAREST_CENTER.lng
  );

  const buildPayload = (): CreateEventInput => ({
    translations: {
      en: { title: titleEn, description: descEn },
      ro:
        titleRo || descRo
          ? { title: titleRo || undefined, description: descRo || undefined }
          : undefined,
    },
    startsAt: new Date(startsAt).toISOString(),
    endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
    genre,
    eventType,
    price: price ? Number(price) : undefined,
    ticketUrl: ticketUrl || undefined,
    websiteUrl: websiteUrl || undefined,
    specialGuest: specialGuest.trim() || undefined,
    coverImageUrl: coverImageUrl ?? undefined,
    images,
    venueName: venueName || undefined,
    address: address || undefined,
    lat,
    lng,
  });

  const save = async (thenSubmit: boolean) => {
    if (savingRef.current) return;
    setError(null);

    if (!venueName || !address) {
      setError("Venue name and address are required.");
      return;
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setError("Pin a location on the map before saving.");
      return;
    }

    savingRef.current = true;
    setSubmitIntent(thenSubmit);
    setSaving(true);

    try {
      const payload: CreateEventInput = {
        ...buildPayload(),
        submitForApproval: thenSubmit,
      };

      const result =
        mode === "create"
          ? await createEvent(payload)
          : await updateEvent(eventId!, payload);

      if (!result.success) {
        savingRef.current = false;
        setError(result.error);
        setSaving(false);
        return;
      }

      router.push("/business/events");
    } catch {
      savingRef.current = false;
      setError("Failed to save event");
      setSaving(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void save(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="glass space-y-6 rounded-3xl p-6">
        <StatusNote
          status={initial?.status}
          rejectionReason={initial?.rejectionReason}
        />

        <fieldset disabled={locked} className="space-y-6 disabled:opacity-60">
          <div>
            <label className={labelClass}>Cover image</label>
            <ImageUploader value={coverImageUrl} onChange={setCoverImageUrl} />
          </div>

          <div>
            <label className={labelClass}>Gallery images</label>
            <ImageUploader value={images} onChange={setImages} multiple />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Title (EN)</label>
              <input
                className={inputClass}
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Title (RO)</label>
              <input
                className={inputClass}
                value={titleRo}
                onChange={(e) => setTitleRo(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Description (EN)</label>
              <textarea
                className={`${inputClass} min-h-[100px] resize-y`}
                value={descEn}
                onChange={(e) => setDescEn(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Description (RO)</label>
              <textarea
                className={`${inputClass} min-h-[100px] resize-y`}
                value={descRo}
                onChange={(e) => setDescRo(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Starts at</label>
              <input
                type="datetime-local"
                className={inputClass}
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Ends at</label>
              <input
                type="datetime-local"
                className={inputClass}
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Genre</label>
              <select
                className={inputClass}
                value={genre}
                onChange={(e) => setGenre(e.target.value as Genre)}
              >
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {formatGenreLabel(g)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Event type</label>
              <select
                className={inputClass}
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EventType)}
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {formatEventTypeLabel(t)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Special Guest (optional)</label>
            <input
              className={inputClass}
              value={specialGuest}
              onChange={(e) => setSpecialGuest(e.target.value)}
              placeholder="DJ Ion Popescu"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Price (RON)</label>
              <input
                type="number"
                className={inputClass}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min={0}
                placeholder="Leave empty if free"
              />
            </div>
            <div>
              <label className={labelClass}>Ticket URL</label>
              <input
                type="url"
                className={inputClass}
                value={ticketUrl}
                onChange={(e) => setTicketUrl(e.target.value)}
                placeholder="https://"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Website / social link</label>
            <input
              type="url"
              className={inputClass}
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://"
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelClass}>Venue name</label>
              <input
                className={inputClass}
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                required
                placeholder={
                  businessType === "venue" ? "Your venue name" : "Venue name"
                }
              />
              {businessType === "venue" ? (
                <p className="mt-1.5 text-xs text-foreground/40">
                  Pre-filled from your venue when available. You can change it
                  for this event and still adjust the pin.
                </p>
              ) : null}
            </div>
            <LocationMapPicker
              address={address}
              onAddressChange={setAddress}
              lat={lat}
              lng={lng}
              onCoordsChange={(nextLat, nextLng) => {
                setLat(nextLat);
                setLng(nextLng);
              }}
              disabled={locked}
              inputClassName={inputClass}
              labelClassName={labelClass}
            />
          </div>
        </fieldset>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {editable ? (
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full border border-firefly/30 px-5 py-2.5 text-sm font-medium text-firefly transition-all hover:bg-firefly/10 disabled:opacity-50"
            >
              {saving && !submitIntent ? "Saving…" : "Save draft"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void save(true)}
              className="rounded-full bg-firefly px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:firefly-glow disabled:opacity-50"
            >
              {saving && submitIntent ? "Submitting…" : "Save & submit for approval"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => router.push("/business/events")}
              className="rounded-full px-5 py-2.5 text-sm text-foreground/60 hover:text-foreground disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => router.push("/business/events")}
            className="rounded-full border border-firefly/30 px-5 py-2.5 text-sm text-firefly transition-all hover:bg-firefly/10"
          >
            Back to events
          </button>
        )}
      </div>
    </form>
  );
}
