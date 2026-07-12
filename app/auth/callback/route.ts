import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isBusinessRole } from "@/lib/auth/session";
import type { UserRole } from "@/types";

function isRecoveryFlow(next: string | null): boolean {
  return next?.includes("reset-password") ?? false;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const locale = searchParams.get("locale") ?? "en";
  const next = searchParams.get("next");
  const recovery = isRecoveryFlow(next);

  const code = searchParams.get("code");
  if (!code || !isSupabaseConfigured()) {
    if (recovery) {
      return NextResponse.redirect(
        `${origin}/${locale}/auth/forgot-password?error=invalid_link`
      );
    }
    return NextResponse.redirect(`${origin}/${locale}/auth?error=oauth`);
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      if (recovery) {
        return NextResponse.redirect(
          `${origin}/${locale}/auth/forgot-password?error=invalid_link`
        );
      }
      return NextResponse.redirect(`${origin}/${locale}/auth?error=oauth`);
    }

    if (recovery) {
      return NextResponse.redirect(`${origin}/${locale}/auth/reset-password`);
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
    const redirectPath = isBusinessRole(role) ? "/business" : "/";

    return NextResponse.redirect(`${origin}/${locale}${redirectPath}`);
  } catch {
    if (recovery) {
      return NextResponse.redirect(
        `${origin}/${locale}/auth/forgot-password?error=invalid_link`
      );
    }
    return NextResponse.redirect(`${origin}/${locale}/auth?error=oauth`);
  }
}
