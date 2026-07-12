"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useMemo, useState } from "react";
import { AdminDuplicateActions } from "@/components/admin/admin-duplicate-actions";
import { AdminEventActions } from "@/components/admin/admin-event-actions";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { formatGenreLabel } from "@/lib/constants/genres";
import type { DuplicateEventGroup } from "@/lib/queries/duplicates";
import { formatDateBadge } from "@/lib/utils/event-format";
import { landingImages } from "@/lib/landing/images";
import type { EventListItem } from "@/types/events";

type PendingEvent = EventListItem & {
  status: string;
  rejectionReason: string | null;
};

type AdminEvent = EventListItem & {
  status: string;
  source: string;
};

type Props = {
  pendingEvents: PendingEvent[];
  allEvents: AdminEvent[];
  duplicateGroups: DuplicateEventGroup[];
};

type Tab = "pending" | "all" | "duplicates";

export function AdminEventsPage({
  pendingEvents,
  allEvents,
  duplicateGroups,
}: Props) {
  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredAll = useMemo(() => {
    return allEvents.filter((e) => {
      const matchesSearch =
        !search ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.venueName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || e.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [allEvents, search, statusFilter]);

  return (
    <div data-route="admin-events">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold md:text-3xl">
            Events
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Moderate submissions and manage all events.
          </p>
        </div>
        <Link href="/admin/events/new">
          <AdminButton size="md">Create event</AdminButton>
        </Link>
      </div>

      <div className="mt-6 flex gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setTab("pending")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            tab === "pending"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Pending ({pendingEvents.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("all")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            tab === "all"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          All events
        </button>
        <button
          type="button"
          onClick={() => setTab("duplicates")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            tab === "duplicates"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Duplicates
          {duplicateGroups.length > 0 ? (
            <span className="ml-1.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-400">
              {duplicateGroups.length}
            </span>
          ) : null}
        </button>
      </div>

      {tab === "pending" ? (
        <div className="mt-6 space-y-4">
          {pendingEvents.length === 0 ? (
            <AdminEmptyState
              title="All caught up"
              description="No events waiting for review."
            />
          ) : (
            pendingEvents.map((event) => (
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
                      {formatDateBadge(event.startsAt)}
                    </span>
                    <AdminBadge status="pending">{event.status}</AdminBadge>
                    <AdminBadge status="default">
                      {formatGenreLabel(event.genre)}
                    </AdminBadge>
                  </div>
                  <h2 className="mt-1 font-medium text-foreground">
                    {event.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {event.venueName}
                  </p>
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
        </div>
      ) : null}

      {tab === "duplicates" ? (
        <div className="mt-6 space-y-4">
          {duplicateGroups.length === 0 ? (
            <AdminEmptyState
              title="No duplicates found"
              description="Events with the same title, date, and venue will appear here."
            />
          ) : (
            duplicateGroups.map((group) => (
              <AdminCard key={group.groupKey} className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Possible duplicate group
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {group.events.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-lg border border-border p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDateBadge(event.startsAt)}
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
        </div>
      ) : null}

      {tab === "all" ? (
        <div className="mt-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              placeholder="Search by title or venue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-foreground/30"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
            >
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border bg-surface-1 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Event</th>
                  <th className="px-4 py-3 font-medium">Venue</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAll.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-border/50 hover:bg-surface-1/50"
                  >
                    <td className="px-4 py-3 font-medium">{event.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {event.venueName}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateBadge(event.startsAt)}
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
                      <AdminEventActions
                        eventId={event.id}
                        status={event.status}
                        compact
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
