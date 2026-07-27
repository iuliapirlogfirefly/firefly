import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured, shouldUseMockData } from "@/lib/supabase/config";

export type ContactMessageStatus = "unread" | "read" | "archived";

export type BusinessContactMessage = {
  id: string;
  subject: string;
  body: string;
  status: ContactMessageStatus;
  createdAt: string;
};

export type AdminContactMessage = {
  id: string;
  subject: string;
  body: string;
  status: ContactMessageStatus;
  createdAt: string;
  businessAccountId: string;
  businessName: string;
  profileId: string;
  replyEmail: string | null;
};

async function getBusinessNameMap(
  businessAccountIds: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (businessAccountIds.length === 0) return map;

  const supabase = await createClient();
  const { data } = await supabase
    .from("business_accounts")
    .select("id, name")
    .in("id", businessAccountIds);

  for (const row of data ?? []) {
    map.set(row.id, row.name);
  }
  return map;
}

export async function getBusinessContactMessages(
  businessAccountId: string
): Promise<BusinessContactMessage[]> {
  if (shouldUseMockData() || !isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contact_messages")
    .select("id, subject, body, status, created_at")
    .eq("business_account_id", businessAccountId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.warn("[contact] Failed to load business messages:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    subject: row.subject,
    body: row.body,
    status: row.status as ContactMessageStatus,
    createdAt: row.created_at,
  }));
}

export async function getUnreadContactMessageCount(): Promise<number> {
  if (shouldUseMockData() || !isSupabaseConfigured()) return 0;

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("contact_messages")
    .select("id", { count: "exact", head: true })
    .eq("status", "unread");

  if (error) {
    console.warn("[contact] Failed to count unread messages:", error.message);
    return 0;
  }

  return count ?? 0;
}

export async function getUnreadContactNotifications(
  limit = 5
): Promise<
  Pick<AdminContactMessage, "id" | "businessName" | "subject" | "createdAt">[]
> {
  if (shouldUseMockData() || !isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contact_messages")
    .select("id, subject, created_at, business_account_id")
    .eq("status", "unread")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn(
      "[contact] Failed to load unread notifications:",
      error.message
    );
    return [];
  }

  const rows = data ?? [];
  const nameMap = await getBusinessNameMap(
    [...new Set(rows.map((row) => row.business_account_id))]
  );

  return rows.map((row) => ({
    id: row.id,
    subject: row.subject,
    createdAt: row.created_at,
    businessName: nameMap.get(row.business_account_id) ?? "A business",
  }));
}

export async function getAdminContactMessages(): Promise<AdminContactMessage[]> {
  if (shouldUseMockData() || !isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contact_messages")
    .select(
      "id, subject, body, status, created_at, business_account_id, profile_id"
    )
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.warn("[contact] Failed to load admin messages:", error.message);
    return [];
  }

  const rows = data ?? [];
  const nameMap = await getBusinessNameMap(
    [...new Set(rows.map((row) => row.business_account_id))]
  );

  const profileIds = [...new Set(rows.map((row) => row.profile_id))];
  const emailByProfile = new Map<string, string | null>();

  if (profileIds.length > 0) {
    try {
      const admin = createAdminClient();
      await Promise.all(
        profileIds.map(async (profileId) => {
          const { data: authUser } =
            await admin.auth.admin.getUserById(profileId);
          emailByProfile.set(profileId, authUser?.user?.email ?? null);
        })
      );
    } catch (e) {
      console.warn("[contact] Failed to resolve reply emails:", e);
    }
  }

  return rows.map((row) => ({
    id: row.id,
    subject: row.subject,
    body: row.body,
    status: row.status as ContactMessageStatus,
    createdAt: row.created_at,
    businessAccountId: row.business_account_id,
    businessName: nameMap.get(row.business_account_id) ?? "Unknown business",
    profileId: row.profile_id,
    replyEmail: emailByProfile.get(row.profile_id) ?? null,
  }));
}
