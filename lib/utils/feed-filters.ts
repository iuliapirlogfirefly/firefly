import type { FeedPostCategory } from "@/types";
import type { FeedPostItem } from "@/lib/queries/feed";
import type { EventFilters } from "@/types/events";

const FILTER_PARAM_KEYS = [
  "genre",
  "eventType",
  "datePreset",
  "customDate",
  "search",
  "promotedOnly",
  "distanceKm",
  "lat",
  "lng",
] as const satisfies ReadonlyArray<keyof EventFilters>;

export type FeedView = "all" | "missed";

export const MISSED_WINDOW_HOURS = 48;

export const MISSED_POST_CATEGORIES: FeedPostCategory[] = [
  "party_updates",
  "nightlife_chaos",
];

export function isWithinMissedWindow(
  publishedAt: string,
  windowHours = MISSED_WINDOW_HOURS
): boolean {
  const ageMs = Date.now() - new Date(publishedAt).getTime();
  return ageMs >= 0 && ageMs <= windowHours * 3_600_000;
}

export function filterMissedPosts(posts: FeedPostItem[]): FeedPostItem[] {
  return posts.filter(
    (post) =>
      isWithinMissedWindow(post.publishedAt) &&
      MISSED_POST_CATEGORIES.includes(post.category)
  );
}

export function parseFeedView(value: string | undefined): FeedView {
  return value === "missed" ? "missed" : "all";
}

function setFilterParam(
  params: URLSearchParams,
  key: keyof EventFilters,
  value: EventFilters[keyof EventFilters] | undefined
) {
  if (value === undefined || value === "" || value === false) {
    params.delete(key);
    return;
  }

  if (key === "promotedOnly") {
    params.set("promotedOnly", "true");
    return;
  }

  params.set(key, String(value));
}

export function serializeEventFilters(filters: EventFilters): URLSearchParams {
  const params = new URLSearchParams();

  for (const key of FILTER_PARAM_KEYS) {
    setFilterParam(params, key, filters[key]);
  }

  return params;
}

export function updateFeedSearchParams(
  current: URLSearchParams,
  patch: Partial<EventFilters>
): URLSearchParams {
  const next = new URLSearchParams(current);

  for (const key of FILTER_PARAM_KEYS) {
    if (!(key in patch)) continue;
    setFilterParam(next, key, patch[key]);
  }

  if ("datePreset" in patch && patch.datePreset !== "custom") {
    next.delete("customDate");
  }

  if ("distanceKm" in patch && !patch.distanceKm) {
    next.delete("lat");
    next.delete("lng");
  }

  return next;
}

export function hasActiveEventFilters(filters: EventFilters): boolean {
  return (
    !!filters.genre ||
    !!filters.eventType ||
    !!filters.datePreset ||
    !!filters.search ||
    !!filters.promotedOnly ||
    !!filters.distanceKm
  );
}
