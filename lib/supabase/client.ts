/**
 * Supabase browser client — disabled while SUPABASE_ENABLED = false.
 */
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
  SUPABASE_DISABLED_MESSAGE,
} from "./config";

export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(SUPABASE_DISABLED_MESSAGE);
  }

  return createBrowserClient<Database>(
    getSupabaseUrl()!,
    getSupabaseAnonKey()!
  );
}
