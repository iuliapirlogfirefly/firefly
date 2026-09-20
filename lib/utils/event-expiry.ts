import type { EventListItem } from "@/types/events";

export const EVENT_FALLBACK_DURATION_MS = 8 * 60 * 60 * 1000;

export function isEventExpired(
  event: Pick<EventListItem, "startsAt" | "endsAt">,
  now = new Date()
): boolean {
  const endMs = event.endsAt
    ? new Date(event.endsAt).getTime()
    : new Date(event.startsAt).getTime() + EVENT_FALLBACK_DURATION_MS;
  return endMs <= now.getTime();
}

export function activeEventsOrFilter(now = new Date()): string {
  const nowIso = now.toISOString();
  const fallbackStartIso = new Date(
    now.getTime() - EVENT_FALLBACK_DURATION_MS
  ).toISOString();
  return `ends_at.gt."${nowIso}",and(ends_at.is.null,starts_at.gt."${fallbackStartIso}")`;
}
