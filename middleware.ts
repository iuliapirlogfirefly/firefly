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
    pathname.startsWith("/_next") ||
    pathname === "/icon" ||
    pathname === "/apple-icon"
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
    let prelaunchActive = false;
    try {
      const { data: launchRow } = await supabase
        .from("site_settings")
        .select("prelaunch_active, prelaunch_ends_at")
        .eq("id", 1)
        .maybeSingle();
      const { isPrelaunchActiveFromSettings, settingsFromRow } = await import(
        "@/lib/launch/config"
      );
      prelaunchActive = isPrelaunchActiveFromSettings(settingsFromRow(launchRow));
    } catch {
      const { isPrelaunchActiveFromSettings, envLaunchSettings } = await import(
        "@/lib/launch/config"
      );
      prelaunchActive = isPrelaunchActiveFromSettings(envLaunchSettings());
    }
    const access = canAccessPath(pathname, role, isSuspended, prelaunchActive);
    if (!access.allowed && access.redirect) {
      const locale = pathname.match(/^\/(en|ro)/)?.[1] ?? "en";
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}${stripLocale(access.redirect)}`;
      if (access.redirect === "/") {
        url.search = "";
      }
      // Guests hitting protected routes (e.g. returning from Stripe) keep a
      // return path so auth can send them back instead of dropping query-only.
      if (role === "guest" && access.redirect === "/login") {
        const returnTo = `${pathname}${request.nextUrl.search}`;
        url.pathname = `/${locale}/auth`;
        url.search = `?next=${encodeURIComponent(returnTo)}`;
      }
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
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon$|apple-icon$|.*\\..*).*)",
  ],
};
