"use client";

import { useRouter } from "@/i18n/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { createAdminEvent, updateAdminEvent } from "@/lib/actions/events";
import { GENRES, formatGenreLabel } from "@/lib/constants/genres";
import {
  EVENT_TYPES,
  formatEventTypeLabel,
} from "@/lib/constants/event-types";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { ImageUploader } from "@/components/events/image-uploader";
import { LocationMapPicker } from "@/components/business/location-map-picker";
import { BUCHAREST_CENTER } from "@/lib/utils/map-coords";
import type { CreateEventInput } from "@/types/events";
import type { EventType, Genre } from "@/types";

type Props = {
  mode: "create" | "edit";
  eventId?: string;
  initial?: Partial<CreateEventInput>;
};

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-foreground/30";

const labelClass = "mb-1.5 block text-xs font-medium text-muted-foreground";

export function EventForm({ mode, eventId, initial }: Props) {
  const t = useTranslations("event");
  const tCommon = useTranslations("common");
  const tGenres = useTranslations("genres");
  const tTypes = useTranslations("eventTypes");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [titleEn, setTitleEn] = useState(
    initial?.translations?.en?.title ?? ""
  );
  const [descEn, setDescEn] = useState(
    initial?.translations?.en?.description ?? ""
  );
  const [titleRo, setTitleRo] = useState(
    initial?.translations?.ro?.title ?? ""
  );
  const [descRo, setDescRo] = useState(
    initial?.translations?.ro?.description ?? ""
  );
  const [startsAt, setStartsAt] = useState(
    initial?.startsAt?.slice(0, 16) ?? ""
  );
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
  const [venueName, setVenueName] = useState(initial?.venueName ?? "");
  const [organizerName, setOrganizerName] = useState(
    initial?.organizerName ?? ""
  );
  const [address, setAddress] = useState(initial?.address ?? "");
  const [lat, setLat] = useState(
    initial?.lat != null && Number.isFinite(initial.lat)
      ? initial.lat
      : BUCHAREST_CENTER.lat
  );
  const [lng, setLng] = useState(
    initial?.lng != null && Number.isFinite(initial.lng)
      ? initial.lng
      : BUCHAREST_CENTER.lng
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!venueName || !address) {
      setError(t("venueRequired"));
      return;
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setError(t("pinRequired"));
      return;
    }

    const data: CreateEventInput = {
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
      organizerName: organizerName.trim() || undefined,
      address: address || undefined,
      lat,
      lng,
    };

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createAdminEvent(data)
          : await updateAdminEvent(eventId!, data);

      if (result.success) {
        router.push("/admin/events");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <AdminCard className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>{t("titleEn")}</label>
            <input
              className={inputClass}
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>{t("titleRo")}</label>
            <input
              className={inputClass}
              value={titleRo}
              onChange={(e) => setTitleRo(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>{t("descriptionEn")}</label>
            <textarea
              className={`${inputClass} min-h-[100px] resize-y`}
              value={descEn}
              onChange={(e) => setDescEn(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>{t("descriptionRo")}</label>
            <textarea
              className={`${inputClass} min-h-[100px] resize-y`}
              value={descRo}
              onChange={(e) => setDescRo(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>{t("startsAt")}</label>
            <input
              type="datetime-local"
              className={inputClass}
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>{t("endsAt")}</label>
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
            <label className={labelClass}>{t("genre")}</label>
            <select
              className={inputClass}
              value={genre}
              onChange={(e) => setGenre(e.target.value as Genre)}
            >
              {GENRES.map((genreOption) => (
                <option key={genreOption} value={genreOption}>
                  {formatGenreLabel(genreOption, tGenres)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>{t("eventType")}</label>
            <select
              className={inputClass}
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
            >
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {formatEventTypeLabel(type, tTypes)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>{t("specialGuest")}</label>
          <input
            className={inputClass}
            value={specialGuest}
            onChange={(e) => setSpecialGuest(e.target.value)}
            placeholder={t("specialGuestPlaceholder")}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>{t("price")}</label>
            <input
              type="number"
              className={inputClass}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min={0}
            />
          </div>
          <div>
            <label className={labelClass}>{t("ticketUrl")}</label>
            <input
              type="url"
              className={inputClass}
              value={ticketUrl}
              onChange={(e) => setTicketUrl(e.target.value)}
              placeholder={t("urlPlaceholder")}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>{t("websiteUrl")}</label>
          <input
            type="url"
            className={inputClass}
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder={t("urlPlaceholder")}
          />
        </div>

        <div>
          <label className={labelClass}>{t("coverImage")}</label>
          <ImageUploader value={coverImageUrl} onChange={setCoverImageUrl} />
        </div>

        <div>
          <label className={labelClass}>{t("galleryImages")}</label>
          <ImageUploader value={images} onChange={setImages} multiple />
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>{t("venueName")}</label>
            <input
              className={inputClass}
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>{t("organizer")}</label>
            <input
              className={inputClass}
              value={organizerName}
              onChange={(e) => setOrganizerName(e.target.value)}
              placeholder={t("organizerPlaceholder")}
            />
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
            inputClassName={inputClass}
            labelClassName={labelClass}
          />
        </div>

        {error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : null}

        <div className="flex gap-3">
          <AdminButton type="submit" size="md" disabled={pending}>
            {pending
              ? tCommon("saving")
              : mode === "create"
                ? t("createPublish")
                : t("saveChanges")}
          </AdminButton>
          <AdminButton
            type="button"
            variant="secondary"
            size="md"
            onClick={() => router.push("/admin/events")}
          >
            {tCommon("cancel")}
          </AdminButton>
        </div>
      </AdminCard>
    </form>
  );
}
