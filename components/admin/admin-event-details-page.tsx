import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AdminEventActions } from "@/components/admin/admin-event-actions";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { formatEventTypeLabel } from "@/lib/constants/event-types";
import { formatGenreLabel } from "@/lib/constants/genres";
import { dateTimeLocale } from "@/lib/i18n/date-locale";
import { landingImages } from "@/lib/landing/images";
import type { AdminEventDetail } from "@/lib/queries/events";
import type { Locale } from "@/types";
import {
  formatDateBadge,
  formatPrice,
  formatTimeRange,
} from "@/lib/utils/event-format";

type Props = {
  event: AdminEventDetail;
};

function TranslationBlock({
  localeLabel,
  title,
  description,
  missing,
}: {
  localeLabel: string;
  title?: string;
  description?: string;
  missing: string;
}) {
  const hasContent = Boolean(title || description);

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {localeLabel}
      </p>
      {hasContent ? (
        <>
          <h3 className="mt-1 font-medium">{title || "—"}</h3>
          <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
            {description || "—"}
          </p>
        </>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">{missing}</p>
      )}
    </div>
  );
}

export async function AdminEventDetailsPage({ event }: Props) {
  const t = await getTranslations("admin");
  const tCommon = await getTranslations("common");
  const tGenres = await getTranslations("genres");
  const tTypes = await getTranslations("eventTypes");
  const locale = (await getLocale()) as Locale;
  const cover = event.coverImageUrl ?? landingImages.editorialCrowd;
  const extraImages = event.images.filter((url) => url && url !== cover);
  const title =
    event.translations.en.title ||
    event.translations.ro?.title ||
    t("untitledEvent");

  const submittedAt = new Intl.DateTimeFormat(dateTimeLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(event.createdAt));

  return (
    <div data-route="admin-event-details">
      <div className="mb-2">
        <Link
          href="/admin/events"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {t("backEvents")}
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <AdminBadge status={event.status}>{event.status}</AdminBadge>
            <AdminBadge status="default">{event.source}</AdminBadge>
          </div>
          <h1 className="mt-2 font-heading text-2xl font-semibold md:text-3xl">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {event.venueName}
            {event.address ? ` · ${event.address}` : ""}
          </p>
        </div>
        <AdminEventActions eventId={event.id} status={event.status} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminCard className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("when")}
          </p>
          <p className="mt-1 text-sm">
            {formatDateBadge(event.startsAt, locale)} ·{" "}
            {formatTimeRange(event.startsAt, event.endsAt, locale)}
          </p>
        </AdminCard>
        <AdminCard className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("type")}
          </p>
          <p className="mt-1 text-sm">
            {formatEventTypeLabel(event.eventType, tTypes)} ·{" "}
            {formatGenreLabel(event.genre, tGenres)} ·{" "}
            {formatPrice(event.price, tCommon)}
          </p>
        </AdminCard>
        <AdminCard className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("submitted")}
          </p>
          <p className="mt-1 text-sm">{submittedAt}</p>
          {event.businessAccountId ? (
            <p className="mt-1 text-sm">
              <Link
                href={`/admin/users/${event.businessAccountId}`}
                className="underline-offset-2 hover:underline"
              >
                {event.businessName ?? t("unknownBusiness")}
              </Link>
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              {t("noBusiness")}
            </p>
          )}
        </AdminCard>
      </div>

      {event.specialGuest ? (
        <p className="mt-4 text-sm">
          {t("specialGuest", { name: event.specialGuest })}
        </p>
      ) : null}

      {event.rejectionReason ? (
        <p className="mt-4 text-sm text-red-400">
          {t("rejectionReason", { reason: event.rejectionReason })}
        </p>
      ) : null}

      <AdminCard className="relative mt-6 overflow-hidden">
        <div className="relative aspect-[16/9] w-full">
          <Image
            src={cover}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 960px"
            className="object-cover"
            priority
          />
        </div>
      </AdminCard>

      {extraImages.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {extraImages.map((url) => (
            <div
              key={url}
              className="relative aspect-square overflow-hidden rounded-xl border border-border"
            >
              <Image
                src={url}
                alt=""
                fill
                sizes="200px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      ) : null}

      <AdminCard className="mt-6 space-y-6 p-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {t("translations")}
        </h2>
        <TranslationBlock
          localeLabel="EN"
          title={event.translations.en.title}
          description={event.translations.en.description}
          missing={t("noTranslation", { locale: "EN" })}
        />
        <TranslationBlock
          localeLabel="RO"
          title={event.translations.ro?.title}
          description={event.translations.ro?.description}
          missing={t("noTranslation", { locale: "RO" })}
        />
      </AdminCard>

      <AdminCard className="mt-4 space-y-2 p-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {t("links")}
        </h2>
        <p className="text-sm">
          {t("tickets")}{" "}
          {event.ticketUrl ? (
            <a
              href={event.ticketUrl}
              target="_blank"
              rel="noreferrer"
              className="break-all underline-offset-2 hover:underline"
            >
              {event.ticketUrl}
            </a>
          ) : (
            <span className="text-muted-foreground">{tCommon("none")}</span>
          )}
        </p>
        <p className="text-sm">
          {t("website")}{" "}
          {event.websiteUrl ? (
            <a
              href={event.websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="break-all underline-offset-2 hover:underline"
            >
              {event.websiteUrl}
            </a>
          ) : (
            <span className="text-muted-foreground">{tCommon("none")}</span>
          )}
        </p>
      </AdminCard>
    </div>
  );
}
