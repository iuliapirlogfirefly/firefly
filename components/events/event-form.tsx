"use client";

import { useRouter } from "@/i18n/navigation";
import { useState, useTransition } from "react";
import { createAdminEvent, updateAdminEvent } from "@/lib/actions/events";
import { GENRES, formatGenreLabel } from "@/lib/constants/genres";
import {
  EVENT_TYPES,
  formatEventTypeLabel,
} from "@/lib/constants/event-types";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { ImageUploader } from "@/components/events/image-uploader";
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
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    initial?.coverImageUrl ?? null
  );
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [venueName, setVenueName] = useState(initial?.venueName ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [lat, setLat] = useState(
    initial?.lat != null ? String(initial.lat) : "44.4268"
  );
  const [lng, setLng] = useState(
    initial?.lng != null ? String(initial.lng) : "26.1025"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
      coverImageUrl: coverImageUrl ?? undefined,
      images,
      venueName: venueName || undefined,
      address: address || undefined,
      lat: Number(lat),
      lng: Number(lng),
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Price (RON)</label>
            <input
              type="number"
              className={inputClass}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min={0}
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
          <label className={labelClass}>Cover image</label>
          <ImageUploader value={coverImageUrl} onChange={setCoverImageUrl} />
        </div>

        <div>
          <label className={labelClass}>Gallery images</label>
          <ImageUploader value={images} onChange={setImages} multiple />
        </div>

        <div>
          <label className={labelClass}>Venue name</label>
          <input
            className={inputClass}
            value={venueName}
            onChange={(e) => setVenueName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className={labelClass}>Address</label>
          <input
            className={inputClass}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Latitude</label>
            <input
              type="number"
              step="any"
              className={inputClass}
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Longitude</label>
            <input
              type="number"
              step="any"
              className={inputClass}
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              required
            />
          </div>
        </div>

        {error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : null}

        <div className="flex gap-3">
          <AdminButton type="submit" size="md" disabled={pending}>
            {pending
              ? "Saving..."
              : mode === "create"
                ? "Create & publish"
                : "Save changes"}
          </AdminButton>
          <AdminButton
            type="button"
            variant="secondary"
            size="md"
            onClick={() => router.push("/admin/events")}
          >
            Cancel
          </AdminButton>
        </div>
      </AdminCard>
    </form>
  );
}
