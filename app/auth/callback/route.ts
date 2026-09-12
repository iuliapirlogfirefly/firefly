import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/auth-js";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createRouteHandlerClient } from "@/lib/supabase/route-handler";
import { isBusinessRole } from "@/lib/auth/session";
import { getAuthenticatedHomePath } from "@/lib/launch/settings";
import type { UserRole } from "@/types";

function isRecoveryFlow(next: string | null, type: string | null): boolean {
  return (next?.includes("reset-password") ?? false) || type === "recovery";
}

function requestHost(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-host");
  return (forwarded ?? request.headers.get("host") ?? "")
    .split(",")[0]
    .trim();
}

function publicOrigin(request: NextRequest): string {
  const host = requestHost(request);
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  if (host === "fireflyapp.ro") {
    return `${proto}://www.fireflyapp.ro`;
  }
  if (host) return `${proto}://${host}`;
  return request.nextUrl.origin;
}

function recoveryErrorRedirect(
  origin: string,
  locale: string
): NextResponse {
  return NextResponse.redirect(
    `${origin}/${locale}/auth/forgot-password?error=invalid_link`
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const locale = searchParams.get("locale") ?? "en";
  const next = searchParams.get("next");
  const type = searchParams.get("type");
  const recovery = isRecoveryFlow(next, type);
  const origin = publicOrigin(request);

  const host = requestHost(request);
  if (host === "fireflyapp.ro") {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.host = "www.fireflyapp.ro";
    return NextResponse.redirect(url, 307);
  }

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");

  if ((!code && !tokenHash) || !isSupabaseConfigured()) {
    if (recovery) return recoveryErrorRedirect(origin, locale);
    return NextResponse.redirect(`${origin}/${locale}/auth?error=oauth`);
  }

  const successPath = recovery
    ? `/${locale}/auth/reset-password`
    : `/${locale}/auth`;
  const response = NextResponse.redirect(`${origin}${successPath}`);

  try {
    const supabase = createRouteHandlerClient(request, response);

    if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({
        type: type as EmailOtpType,
        token_hash: tokenHash,
      });
      if (error) {
        console.warn("[auth/callback] verifyOtp failed:", error.message);
        if (recovery) return recoveryErrorRedirect(origin, locale);
        return NextResponse.redirect(`${origin}/${locale}/auth?error=oauth`);
      }
    } else if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.warn(
          "[auth/callback] exchangeCodeForSession failed:",
          error.message
        );
        if (recovery) return recoveryErrorRedirect(origin, locale);
        return NextResponse.redirect(`${origin}/${locale}/auth?error=oauth`);
      }
    }

    if (recovery) {
      return response;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${origin}/${locale}/auth?error=oauth`);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = (profile?.role as UserRole) ?? "user";
    const redirectPath = await getAuthenticatedHomePath(isBusinessRole(role));

    const home = NextResponse.redirect(`${origin}/${locale}${redirectPath}`);
    response.cookies.getAll().forEach((cookie) => {
      home.cookies.set(cookie);
    });
    return home;
  } catch (error) {
    console.warn("[auth/callback] unexpected error:", error);
    if (recovery) return recoveryErrorRedirect(origin, locale);
    return NextResponse.redirect(`${origin}/${locale}/auth?error=oauth`);
  }
}
