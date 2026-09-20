import type { EventType } from "@/types";

export const EVENT_TYPES: EventType[] = [
  "party",
  "concert",
  "festival",
  "rooftop",
  "brunch_day_party",
  "pool_party",
  "social_gathering",
  "club_night",
  "live_performance",
  "private_event",
];

export function formatEventTypeLabel(
  type: EventType,
  t: (key: string) => string
): string {
  return t(type);
}
