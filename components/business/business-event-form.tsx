"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("business");

  if (!status || status === "draft") {
    return <p className="text-xs text-foreground/50">{t("draftHint")}</p>;
  }
  if (status === "pending") {
    return <p className="text-xs text-amber-warm">{t("pendingHint")}</p>;
  }
  if (status === "rejected") {
    return (
      <p className="text-xs text-destructive">
        {t("rejectedHint", {
          detail: rejectionReason ? `: ${rejectionReason}` : ".",
        })}
      </p>
    );
  }
  if (status === "published") {
    return <p className="text-xs text-firefly">{t("publishedHint")}</p>;
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
  const t = useTranslations("business");
  const tEvent = useTranslations("event");
  const tGenres = useTranslations("genres");
  const tEventTypes = useTranslations("eventTypes");
  const tCommon = useTranslations("common");
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
      setError(tEvent("venueRequired"));
      return;
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setError(tEvent("pinRequired"));
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
      setError(t("saveFailed"));
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
            <label className={labelClass}>{tEvent("coverImage")}</label>
            <ImageUploader value={coverImageUrl} onChange={setCoverImageUrl} />
          </div>

          <div>
            <label className={labelClass}>{tEvent("galleryImages")}</label>
            <ImageUploader value={images} onChange={setImages} multiple />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>{tEvent("titleEn")}</label>
              <input
                className={inputClass}
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>{tEvent("titleRo")}</label>
              <input
                className={inputClass}
                value={titleRo}
                onChange={(e) => setTitleRo(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>{tEvent("descriptionEn")}</label>
              <textarea
                className={`${inputClass} min-h-[100px] resize-y`}
                value={descEn}
                onChange={(e) => setDescEn(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>{tEvent("descriptionRo")}</label>
              <textarea
                className={`${inputClass} min-h-[100px] resize-y`}
                value={descRo}
                onChange={(e) => setDescRo(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>{tEvent("startsAt")}</label>
              <input
                type="datetime-local"
                className={inputClass}
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>{tEvent("endsAt")}</label>
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
              <label className={labelClass}>{tEvent("genre")}</label>
              <select
                className={inputClass}
                value={genre}
                onChange={(e) => setGenre(e.target.value as Genre)}
              >
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {formatGenreLabel(g, tGenres)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{tEvent("eventType")}</label>
              <select
                className={inputClass}
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EventType)}
              >
                {EVENT_TYPES.map((eventTypeOption) => (
                  <option key={eventTypeOption} value={eventTypeOption}>
                    {formatEventTypeLabel(eventTypeOption, tEventTypes)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>{tEvent("specialGuest")}</label>
            <input
              className={inputClass}
              value={specialGuest}
              onChange={(e) => setSpecialGuest(e.target.value)}
              placeholder={tEvent("specialGuestPlaceholder")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>{tEvent("price")}</label>
              <input
                type="number"
                className={inputClass}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min={0}
                placeholder={tEvent("pricePlaceholder")}
              />
            </div>
            <div>
              <label className={labelClass}>{tEvent("ticketUrl")}</label>
              <input
                type="url"
                className={inputClass}
                value={ticketUrl}
                onChange={(e) => setTicketUrl(e.target.value)}
                placeholder={tEvent("urlPlaceholder")}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>{tEvent("websiteUrl")}</label>
            <input
              type="url"
              className={inputClass}
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder={tEvent("urlPlaceholder")}
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelClass}>{tEvent("venueName")}</label>
              <input
                className={inputClass}
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                required
                placeholder={tEvent("venueName")}
              />
              {businessType === "venue" ? (
                <p className="mt-1.5 text-xs text-foreground/40">
                  {t("venueNameHint")}
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
              {saving && !submitIntent ? tCommon("saving") : t("saveDraft")}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void save(true)}
              className="rounded-full bg-firefly px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:firefly-glow disabled:opacity-50"
            >
              {saving && submitIntent ? t("submitting") : t("saveAndSubmit")}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => router.push("/business/events")}
              className="rounded-full px-5 py-2.5 text-sm text-foreground/60 hover:text-foreground disabled:opacity-50"
            >
              {tCommon("cancel")}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => router.push("/business/events")}
            className="rounded-full border border-firefly/30 px-5 py-2.5 text-sm text-firefly transition-all hover:bg-firefly/10"
          >
            {t("backToEvents")}
          </button>
        )}
      </div>
    </form>
  );
}
