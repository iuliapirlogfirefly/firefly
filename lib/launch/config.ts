export type PrelaunchMode = "auto" | "on" | "off";

export type LaunchSettings = {
  active: boolean;
  endsAt: Date | null;
};

export const LAUNCH_TIME_ZONE = "Europe/Bucharest";

const LOCKED_EXACT = ["/map", "/calendar", "/feed", "/missed", "/events", "/saved", "/business"];
const LOCKED_PREFIXES = [
  "/map/",
  "/calendar/",
  "/feed/",
  "/missed/",
  "/events/",
  "/saved/",
  "/business/",
];

function trimEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function getPrelaunchMode(): PrelaunchMode {
  const raw = trimEnv(process.env.NEXT_PUBLIC_PRELAUNCH_MODE)?.toLowerCase();
  if (raw === "on" || raw === "off") return raw;
  return "auto";
}

function getEnvLaunchAt(): Date | null {
  const raw = trimEnv(process.env.NEXT_PUBLIC_LAUNCH_AT);
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function envLaunchSettings(): LaunchSettings {
  const mode = getPrelaunchMode();
  const endsAt = getEnvLaunchAt();
  if (mode === "off") return { active: false, endsAt };
  if (mode === "on") return { active: true, endsAt };
  return { active: Boolean(endsAt), endsAt };
}

export function settingsFromRow(
  row: { prelaunch_active: boolean; prelaunch_ends_at: string | null } | null
): LaunchSettings {
  if (!row) return envLaunchSettings();
  return {
    active: row.prelaunch_active,
    endsAt: row.prelaunch_ends_at ? new Date(row.prelaunch_ends_at) : null,
  };
}

export function isPrelaunchActiveFromSettings(
  settings: LaunchSettings,
  now = new Date()
): boolean {
  if (!settings.active) return false;
  if (!settings.endsAt) return true;
  return now.getTime() < settings.endsAt.getTime();
}

export function isPrelaunchLockedPath(path: string): boolean {
  if (LOCKED_EXACT.includes(path)) return true;
  return LOCKED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function formatLaunchAt(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale === "ro" ? "ro-RO" : "en-GB", {
    timeZone: LAUNCH_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function remainingUntil(launchAt: Date, now = new Date()) {
  const diff = Math.max(0, launchAt.getTime() - now.getTime());
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    done: diff <= 0,
  };
}
