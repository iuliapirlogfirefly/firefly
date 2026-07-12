/**
 * Supabase server client — disabled while SUPABASE_ENABLED = false.
 * Set SUPABASE_ENABLED = true in lib/supabase/config.ts to activate.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";
import {
  getSupabaseAnonKey,
  isSupabaseConfigured,
  SUPABASE_DISABLED_MESSAGE,
} from "./config";

const REMEMBER_ME_MAX_AGE = 60 * 60 * 24 * 30;

type AuthClientOptions = {
  rememberMe?: boolean;
};

export async function createAuthClient(options: AuthClientOptions = {}) {
  const rememberMe = options.rememberMe ?? true;

  if (!isSupabaseConfigured()) {
    throw new Error(SUPABASE_DISABLED_MESSAGE);
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getSupabaseAnonKey()!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options: cookieOptions }) => {
              const { maxAge: _maxAge, ...rest } = cookieOptions ?? {};
              cookieStore.set(
                name,
                value,
                rememberMe ? { ...rest, maxAge: REMEMBER_ME_MAX_AGE } : rest
              );
            });
          } catch {
            // Called from Server Component — ignore
          }
        },
      },
    }
  );
}

export async function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(SUPABASE_DISABLED_MESSAGE);
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getSupabaseAnonKey()!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component — ignore
          }
        },
      },
    }
  );
}
