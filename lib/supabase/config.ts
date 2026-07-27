/**
 * When false, the app uses mock data for reads and skips all DB/auth writes.
 * Also requires NEXT_PUBLIC_SUPABASE_URL and a publishable/anon key in .env.local.
 */
export const SUPABASE_ENABLED = true;

function trimEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

export function getSupabaseUrl(): string | undefined {
  return trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getSupabaseAnonKey(): string | undefined {
  // Prefer legacy JWT anon key; publishable keys (sb_publishable_...) also work.
  return trimEnv(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

/** @deprecated Use getSupabaseAnonKey */
export function getSupabasePublishableKey(): string | undefined {
  return getSupabaseAnonKey();
}

export function getSupabaseServiceRoleKey(): string | undefined {
  return trimEnv(
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
  );
}

export function isSupabaseConfigured(): boolean {
  if (!SUPABASE_ENABLED) return false;

  return !!(getSupabaseUrl() && getSupabaseAnonKey());
}

/** Use mock data for reads when Supabase is off or NEXT_PUBLIC_USE_MOCK_DATA=true */
export function shouldUseMockData(): boolean {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false") return false;
  if (!SUPABASE_ENABLED) return true;
  return process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
}

export function isSupabaseAdminConfigured(): boolean {
  return isSupabaseConfigured() && !!getSupabaseServiceRoleKey();
}

export const SUPABASE_DISABLED_MESSAGE =
  "Supabase is disabled. Set SUPABASE_ENABLED = true in lib/supabase/config.ts and configure .env.local.";
