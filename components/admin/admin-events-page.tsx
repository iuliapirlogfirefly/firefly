"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AdminDuplicateActions } from "@/components/admin/admin-duplicate-actions";
import { AdminEventActions } from "@/components/admin/admin-event-actions";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { AdminPagination } from "@/components/admin/ui/admin-pagination";
import { AdminSearchForm } from "@/components/admin/ui/admin-search-form";
import { buildAdminQuery, type Paginated } from "@/lib/admin/pagination";
import { formatGenreLabel } from "@/lib/constants/genres";
import type { DuplicateEventGroup } from "@/lib/queries/duplicates";
import type {
  AdminEventRow,
  AdminPendingEvent,
} from "@/lib/queries/events";
import { formatDateBadge } from "@/lib/utils/event-format";
import { landingImages } from "@/lib/landing/images";
import type { Locale } from "@/types";

type Tab = "pending" | "all" | "duplicates";

const STATUS_OPTIONS = [
  "published",
  "pending",
  "rejected",
  "draft",
  "archived",
] as const;

type Props = {
  tab: Tab;
  q: string;
  status: string;
  pendingCount: number;
  pendingEvents: Paginated<AdminPendingEvent>;
  allEvents: Paginated<AdminEventRow>;
  duplicateGroups: Paginated<DuplicateEventGroup>;
};

function tabClass(active: boolean) {
  return `border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
    active
      ? "border-foreground text-foreground"
      : "border-transparent text-muted-foreground hover:text-foreground"
  }`;
}

export function AdminEventsPage({
  tab,
  q,
  status,
  pendingCount,
  pendingEvents,
  allEvents,
  duplicateGroups,
}: Props) {
  const t = useTranslations("admin");
  const tGenres = useTranslations("genres");
  const tStatus = useTranslations("common.status");
  const locale = useLocale() as Locale;

  return (
    <div data-route="admin-events">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold md:text-3xl">
            {t("events")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("eventsSubtitle")}
          </p>
        </div>
        <Link href="/admin/events/new">
          <AdminButton size="md">{t("createEvent")}</AdminButton>
        </Link>
      </div>

      <div className="mt-6 flex gap-2 border-b border-border">
        <Link href="/admin/events" className={tabClass(tab === "pending")}>
          {t("tabPending", { count: pendingCount })}
        </Link>
        <Link
          href={`/admin/events${buildAdminQuery({ tab: "all" })}`}
          className={tabClass(tab === "all")}
        >
          {t("tabAll")}
        </Link>
        <Link
          href={`/admin/events${buildAdminQuery({ tab: "duplicates" })}`}
          className={tabClass(tab === "duplicates")}
        >
          {t("tabDuplicates")}
          {tab === "duplicates" && duplicateGroups.total > 0 ? (
            <span className="ml-1.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-400">
              {duplicateGroups.total}
            </span>
          ) : null}
        </Link>
      </div>

      {tab === "pending" ? (
        <div className="mt-6 space-y-4">
          {pendingEvents.items.length === 0 ? (
            <AdminEmptyState
              title={t("allCaughtUp")}
              description={t("noPendingEvents")}
            />
          ) : (
            pendingEvents.items.map((event) => (
              <AdminCard key={event.id} className="flex gap-4 p-4">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={event.coverImageUrl ?? landingImages.editorialCrowd}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDateBadge(event.startsAt, locale)}
                    </span>
                    <AdminBadge status="pending">{event.status}</AdminBadge>
                    {event.genres.map((genre) => (
                      <AdminBadge key={genre} status="default">
                        {formatGenreLabel(genre, tGenres, event.genreOther)}
                      </AdminBadge>
                    ))}
                  </div>
                  <h2 className="mt-1 font-medium text-foreground">
                    <Link
                      href={`/admin/events/${event.id}`}
                      className="hover:underline"
                    >
                      {event.title}
                    </Link>
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {event.venueName}
                  </p>
                  <Link
                    href={`/admin/events/${event.id}`}
                    className="mt-2 inline-block text-sm text-foreground underline-offset-2 hover:underline"
                  >
                    {t("viewDetails")}
                  </Link>
                  <div className="mt-4">
                    <AdminEventActions
                      eventId={event.id}
                      status={event.status}
                    />
                  </div>
                </div>
              </AdminCard>
            ))
          )}
          <AdminPagination
            pathname="/admin/events"
            page={pendingEvents.page}
            total={pendingEvents.total}
          />
        </div>
      ) : null}

      {tab === "duplicates" ? (
        <div className="mt-6 space-y-4">
          {duplicateGroups.items.length === 0 ? (
            <AdminEmptyState
              title={t("noDuplicates")}
              description={t("noDuplicatesHint")}
            />
          ) : (
            duplicateGroups.items.map((group) => (
              <AdminCard key={group.groupKey} className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("duplicateGroup")}
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {group.events.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-lg border border-border p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDateBadge(event.startsAt, locale)}
                        </span>
                        <AdminBadge status={event.status as "pending"}>
                          {event.status}
                        </AdminBadge>
                        <AdminBadge status="default">{event.source}</AdminBadge>
                      </div>
                      <h3 className="mt-1 font-medium">{event.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {event.venueName}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <AdminDuplicateActions group={group} />
                </div>
              </AdminCard>
            ))
          )}
          <AdminPagination
            pathname="/admin/events"
            params={{ tab: "duplicates" }}
            page={duplicateGroups.page}
            total={duplicateGroups.total}
          />
        </div>
      ) : null}

      {tab === "all" ? (
        <div className="mt-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <AdminSearchForm
              q={q}
              placeholder={t("searchEvents")}
              hidden={{
                tab: "all",
                status: status !== "all" ? status : undefined,
              }}
            />
            <form method="get">
              <input type="hidden" name="tab" value="all" />
              {q ? <input type="hidden" name="q" value={q} /> : null}
              <select
                name="status"
                defaultValue={status}
                onChange={(event) => event.currentTarget.form?.requestSubmit()}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
              >
                <option value="all">{t("allStatuses")}</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {tStatus(option)}
                  </option>
                ))}
              </select>
            </form>
          </div>

          {allEvents.items.length === 0 ? (
            <AdminEmptyState
              title={t("nothingHere")}
              description={t("noEventsMatch")}
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-border bg-surface-1 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t("colEvent")}</th>
                    <th className="px-4 py-3 font-medium">{t("colVenue")}</th>
                    <th className="px-4 py-3 font-medium">{t("colPublished")}</th>
                    <th className="px-4 py-3 font-medium">{t("colEventDate")}</th>
                    <th className="px-4 py-3 font-medium">{t("colStatus")}</th>
                    <th className="px-4 py-3 font-medium">{t("colSource")}</th>
                    <th className="px-4 py-3 font-medium">{t("colActions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {allEvents.items.map((event) => (
                    <tr
                      key={event.id}
                      className="border-b border-border/50 hover:bg-surface-1/50"
                    >
                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={`/admin/events/${event.id}`}
                          className="hover:underline"
                        >
                          {event.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {event.venueName}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {event.publishedAt
                          ? formatDateBadge(event.publishedAt, locale)
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDateBadge(event.startsAt, locale)}
                      </td>
                      <td className="px-4 py-3">
                        <AdminBadge status={event.status as "pending"}>
                          {event.status}
                        </AdminBadge>
                      </td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">
                        {event.source}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2">
                          <Link
                            href={`/admin/events/${event.id}`}
                            className="text-sm text-foreground underline-offset-2 hover:underline"
                          >
                            {t("viewDetails")}
                          </Link>
                          <AdminEventActions
                            eventId={event.id}
                            status={event.status}
                            compact
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <AdminPagination
            pathname="/admin/events"
            params={{
              tab: "all",
              q,
              status: status !== "all" ? status : undefined,
            }}
            page={allEvents.page}
            total={allEvents.total}
          />
        </div>
      ) : null}
    </div>
  );
}
