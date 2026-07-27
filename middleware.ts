import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/lib/supabase/config";
import { clearSupabaseAuthCookies } from "@/lib/supabase/cookies";

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/_next")
  ) {
    return NextResponse.next();
  }

  const intlResponse = intlMiddleware(request);

  if (!isSupabaseConfigured()) {
    return intlResponse;
  }

  try {
    const { updateSession } = await import("@/lib/supabase/middleware");
    const { canAccessPath, stripLocale } = await import("@/lib/auth/guards");
    const { createServerClient } = await import("@supabase/ssr");
    const supabaseResponse = await updateSession(request);
    const supabase = createServerClient(
      getSupabaseUrl()!,
      getSupabaseAnonKey()!,
      { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    let role: import("@/types").UserRole | "guest" = "guest";
    let isSuspended = false;
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, is_suspended")
        .eq("id", user.id)
        .single();
      role = (profile?.role as import("@/types").UserRole) ?? "user";
      isSuspended = profile?.is_suspended === true;

      if (
        !isSuspended &&
        (role === "business_venue" || role === "business_organizer")
      ) {
        const { data: business } = await supabase
          .from("business_accounts")
          .select("status")
          .eq("profile_id", user.id)
          .single();
        isSuspended = business?.status === "suspended";
      }
    }
    const access = canAccessPath(pathname, role, isSuspended);
    if (!access.allowed && access.redirect) {
      const locale = pathname.match(/^\/(en|ro)/)?.[1] ?? "en";
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}${stripLocale(access.redirect)}`;
      if (isSuspended) {
        clearSupabaseAuthCookies(request, intlResponse);
      }
      return NextResponse.redirect(url);
    }
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      intlResponse.cookies.set(cookie.name, cookie.value);
    });

    return intlResponse;
  } catch (error) {
    console.warn(
      "[middleware] Supabase session error — clearing auth cookies.",
      error
    );
    clearSupabaseAuthCookies(request, intlResponse);
    return intlResponse;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
