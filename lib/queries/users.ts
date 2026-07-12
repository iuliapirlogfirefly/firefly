import type { UserRole, BusinessStatus } from "@/types";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole | string;
  status: BusinessStatus | "active";
  joinedAt: string;
  businessAccountId?: string;
  businessType?: "venue" | "organizer";
};

export async function getAdminUsers(): Promise<AdminUserRow[]> {
  const { shouldUseMockData, isSupabaseConfigured } = await import(
    "@/lib/supabase/config"
  );
  if (shouldUseMockData()) {
    const { getMockAdminUsers } = await import("@/lib/mocks/data");
    return getMockAdminUsers() as AdminUserRow[];
  }

  if (!isSupabaseConfigured()) return [];

  const { createClient } = await import("@/lib/supabase/server");
  const { createAdminClient } = await import("@/lib/supabase/admin");

  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, role, display_name, created_at, is_suspended")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const { data: businesses } = await supabase
    .from("business_accounts")
    .select("id, profile_id, name, type, status");

  const businessByProfile = new Map(
    (businesses ?? []).map((b) => [b.profile_id, b])
  );

  const rows: AdminUserRow[] = [];

  for (const profile of profiles ?? []) {
    const business = businessByProfile.get(profile.id);
    const { data: authUser } = await admin.auth.admin.getUserById(profile.id);

    const role = profile.role as UserRole;
    const isBusiness = role === "business_venue" || role === "business_organizer";

    rows.push({
      id: profile.id,
      name: business?.name ?? profile.display_name ?? "User",
      email: authUser?.user?.email ?? "—",
      role,
      status: isBusiness
        ? (business?.status as BusinessStatus) ?? "pending"
        : profile.is_suspended
          ? "suspended"
          : "active",
      joinedAt: profile.created_at?.slice(0, 10) ?? "",
      businessAccountId: business?.id,
      businessType: business?.type as "venue" | "organizer" | undefined,
    });
  }

  return rows;
}

export async function getPendingBusinessCount(): Promise<number> {
  const { shouldUseMockData, isSupabaseConfigured } = await import(
    "@/lib/supabase/config"
  );
  if (shouldUseMockData()) {
    const { getMockAdminUsers } = await import("@/lib/mocks/data");
    return getMockAdminUsers().filter(
      (u) =>
        (u.role === "business_venue" || u.role === "business_organizer") &&
        u.status === "pending"
    ).length;
  }

  if (!isSupabaseConfigured()) return 0;

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("business_accounts")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) throw error;
  return count ?? 0;
}

export async function getNewsletterSubscriberCount(): Promise<number> {
  const { shouldUseMockData, isSupabaseConfigured } = await import(
    "@/lib/supabase/config"
  );
  if (shouldUseMockData()) return 8420;

  if (!isSupabaseConfigured()) return 0;

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("newsletter_opt_in", true);

  if (error) throw error;
  return count ?? 0;
}
