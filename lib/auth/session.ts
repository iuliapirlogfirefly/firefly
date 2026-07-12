import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, shouldUseMockData } from "@/lib/supabase/config";
import { getMockSession } from "@/lib/mocks/data";
import type { SessionInfo } from "@/types/events";
import type { UserRole } from "@/types";

const guestSession = (): SessionInfo => ({
  userId: null,
  role: "guest",
  email: null,
  displayName: null,
  preferredLocale: "en",
  businessAccountId: null,
  isSuspended: false,
});

export async function getSession(): Promise<SessionInfo> {
  if (shouldUseMockData()) return getMockSession();

  if (!isSupabaseConfigured()) {
    return guestSession();
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return guestSession();
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, display_name, preferred_locale, is_suspended")
      .eq("id", user.id)
      .single();

    let businessAccountId: string | null = null;
    let businessSuspended = false;
    if (
      profile?.role === "business_venue" ||
      profile?.role === "business_organizer"
    ) {
      const { data: business } = await supabase
        .from("business_accounts")
        .select("id, status")
        .eq("profile_id", user.id)
        .single();
      businessAccountId = business?.id ?? null;
      businessSuspended = business?.status === "suspended";
    }

    return {
      userId: user.id,
      role: (profile?.role as UserRole) ?? "user",
      email: user.email ?? null,
      displayName: profile?.display_name ?? null,
      preferredLocale:
        (profile?.preferred_locale as "en" | "ro") ?? "en",
      businessAccountId,
      isSuspended: profile?.is_suspended === true || businessSuspended,
    };
  } catch (error) {
    console.warn(
      "[auth] Failed to read session — treating as guest. Clear site cookies if this persists.",
      error
    );
    return guestSession();
  }
}

export function isBusinessRole(role: string): boolean {
  return role === "business_venue" || role === "business_organizer";
}

export function requireAuth(session: SessionInfo): string {
  if (!session.userId) throw new Error("Authentication required");
  return session.userId;
}

export function requireRole(session: SessionInfo, roles: UserRole[]): void {
  if (!session.userId || !roles.includes(session.role as UserRole)) {
    throw new Error("Insufficient permissions");
  }
}
