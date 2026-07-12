import type { NextRequest, NextResponse } from "next/server";

export function getSupabaseAuthCookiePrefix(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;

  try {
    const projectRef = new URL(url).hostname.split(".")[0];
    return `sb-${projectRef}-auth-token`;
  } catch {
    return null;
  }
}

export function clearSupabaseAuthCookies(
  request: NextRequest,
  response: NextResponse
) {
  const prefix = getSupabaseAuthCookiePrefix();
  if (!prefix) return;

  for (const cookie of request.cookies.getAll()) {
    if (cookie.name === prefix || cookie.name.startsWith(`${prefix}.`)) {
      response.cookies.set(cookie.name, "", {
        path: "/",
        maxAge: 0,
      });
    }
  }
}
