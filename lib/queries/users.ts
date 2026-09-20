import type { UserRole, BusinessStatus } from "@/types";
import {
  emptyPage,
  ilikeContains,
  paginateItems,
  rangeForPage,
  toPaginated,
  type Paginated,
} from "@/lib/admin/pagination";

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

const BUSINESS_ROLES = ["business_venue", "business_organizer"] as const;

function isBusinessRole(role: string) {
  return role === "business_venue" || role === "business_organizer";
}

async function emailsByUserId(userIds: string[]) {
  const emails = new Map<string, string>();
  if (userIds.length === 0) return emails;

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  await Promise.all(
    userIds.map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id);
      emails.set(id, data.user?.email ?? "—");
    })
  );
  return emails;
}

export async function getAdminUserTabCounts(): Promise<{
  businesses: number;
  users: number;
}> {
  const { shouldUseMockData, isSupabaseConfigured } = await import(
    "@/lib/supabase/config"
  );
  if (shouldUseMockData()) {
    const { getMockAdminUsers } = await import("@/lib/mocks/data");
    const rows = getMockAdminUsers();
    return {
      businesses: rows.filter((u) => isBusinessRole(u.role)).length,
      users: rows.filter((u) => !isBusinessRole(u.role)).length,
    };
  }

  if (!isSupabaseConfigured()) return { businesses: 0, users: 0 };

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const [{ count: businesses }, { count: users }] = await Promise.all([
    supabase
      .from("business_accounts")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .not("role", "in", `(${BUSINESS_ROLES.join(",")})`),
  ]);

  return { businesses: businesses ?? 0, users: users ?? 0 };
}

export async function getAdminUsers(
  options: {
    tab?: "businesses" | "users";
    page?: number;
    q?: string;
  } = {}
): Promise<Paginated<AdminUserRow>> {
  const tab = options.tab ?? "businesses";
  const page = options.page ?? 1;
  const q = options.q ?? "";
  const pattern = ilikeContains(q);

  const { shouldUseMockData, isSupabaseConfigured } = await import(
    "@/lib/supabase/config"
  );
  if (shouldUseMockData()) {
    const { getMockAdminUsers } = await import("@/lib/mocks/data");
    const filtered = (getMockAdminUsers() as AdminUserRow[]).filter((user) => {
      const isBusiness = isBusinessRole(String(user.role));
      if (tab === "businesses" ? !isBusiness : isBusiness) return false;
      if (!q) return true;
      const haystack = `${user.name} ${user.email}`.toLowerCase();
      return haystack.includes(q.toLowerCase());
    });
    return paginateItems(filtered, page);
  }

  if (!isSupabaseConfigured()) return emptyPage(page);

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { from, to, pageSize, page: safePage } = rangeForPage(page);

  if (tab === "businesses") {
    let query = supabase
      .from("business_accounts")
      .select("id, profile_id, name, type, status, created_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false });
    if (pattern) query = query.ilike("name", pattern);

    const { data: businesses, error, count } = await query.range(from, to);
    if (error) throw error;

    const rows = businesses ?? [];
    const profileIds = rows.map((row) => row.profile_id);
    const { data: profiles } =
      profileIds.length > 0
        ? await supabase
            .from("profiles")
            .select("id, role, display_name, created_at, is_suspended")
            .in("id", profileIds)
        : { data: [] };
    const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
    const emails = await emailsByUserId(profileIds);

    return toPaginated(
      rows.map((business) => {
        const profile = profileById.get(business.profile_id);
        return {
          id: business.profile_id,
          name: business.name,
          email: emails.get(business.profile_id) ?? "—",
          role: (profile?.role ?? "business_venue") as UserRole,
          status: (business.status as BusinessStatus) ?? "pending",
          joinedAt: (profile?.created_at ?? business.created_at)?.slice(0, 10) ?? "",
          businessAccountId: business.id,
          businessType: business.type as "venue" | "organizer" | undefined,
        };
      }),
      count ?? 0,
      safePage,
      pageSize
    );
  }

  let query = supabase
    .from("profiles")
    .select("id, role, display_name, created_at, is_suspended", {
      count: "exact",
    })
    .not("role", "in", `(${BUSINESS_ROLES.join(",")})`)
    .order("created_at", { ascending: false });
  if (pattern) query = query.ilike("display_name", pattern);

  const { data: profiles, error, count } = await query.range(from, to);
  if (error) throw error;

  const rows = profiles ?? [];
  const emails = await emailsByUserId(rows.map((row) => row.id));

  return toPaginated(
    rows.map((profile) => ({
      id: profile.id,
      name: profile.display_name ?? "User",
      email: emails.get(profile.id) ?? "—",
      role: profile.role as UserRole,
      status: profile.is_suspended ? "suspended" : "active",
      joinedAt: profile.created_at?.slice(0, 10) ?? "",
    })),
    count ?? 0,
    safePage,
    pageSize
  );
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
