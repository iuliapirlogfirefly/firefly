/**
 * Supabase admin client — disabled while SUPABASE_ENABLED = false.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import {
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
  isSupabaseAdminConfigured,
  SUPABASE_DISABLED_MESSAGE,
} from "./config";

export function createAdminClient() {
  if (!isSupabaseAdminConfigured()) {
    throw new Error(SUPABASE_DISABLED_MESSAGE);
  }

  return createClient<Database>(
    getSupabaseUrl()!,
    getSupabaseServiceRoleKey()!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
