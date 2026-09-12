import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/database.types";
import { getSupabaseAnonKey, getSupabaseUrl } from "./config";

/**
 * Bind session cookies to a specific Route Handler response.
 * `cookies()` from `next/headers` can drop Set-Cookie on redirects.
 */
export function createRouteHandlerClient(
  request: NextRequest,
  response: NextResponse
) {
  return createServerClient<Database>(getSupabaseUrl()!, getSupabaseAnonKey()!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
}
