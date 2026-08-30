import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  envLaunchSettings,
  isPrelaunchActiveFromSettings,
  settingsFromRow,
  type LaunchSettings,
} from "@/lib/launch/config";

export async function fetchLaunchSettings(): Promise<LaunchSettings> {
  if (!isSupabaseConfigured()) return envLaunchSettings();

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("prelaunch_active, prelaunch_ends_at")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) return envLaunchSettings();
    return settingsFromRow(data);
  } catch {
    return envLaunchSettings();
  }
}

export const getLaunchSettings = cache(fetchLaunchSettings);

export async function isPrelaunchActive(now = new Date()): Promise<boolean> {
  const settings = await getLaunchSettings();
  return isPrelaunchActiveFromSettings(settings, now);
}

export async function getLaunchAt(): Promise<Date | null> {
  const settings = await getLaunchSettings();
  return settings.endsAt;
}

export async function getAuthenticatedHomePath(isBusiness: boolean): Promise<string> {
  if (await isPrelaunchActive()) return "/";
  return isBusiness ? "/business" : "/";
}

export async function getSignOutRedirect(locale: string): Promise<string> {
  return (await isPrelaunchActive()) ? `/${locale}` : `/${locale}/map`;
}
