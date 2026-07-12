import type { EventType } from "@/types";

export const EVENT_TYPES: EventType[] = [
  "party",
  "concert",
  "festival",
  "rooftop",
  "brunch_day_party",
  "social_gathering",
  "club_night",
  "live_performance",
  "private_event",
];

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  party: "Party",
  concert: "Concert",
  festival: "Festival",
  rooftop: "Rooftop",
  brunch_day_party: "Brunch / Day Party",
  social_gathering: "Social Gathering",
  club_night: "Club Night",
  live_performance: "Live Performance",
  private_event: "Private Event",
};

export function formatEventTypeLabel(type: EventType): string {
  return EVENT_TYPE_LABELS[type];
}
