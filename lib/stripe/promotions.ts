import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { PromotionType } from "@/types";

type DbClient = SupabaseClient<Database>;

export async function hasActivePromotion(
  client: DbClient,
  type: PromotionType,
  targetId: string
): Promise<boolean> {
  const now = new Date().toISOString();
  const { data } = await client
    .from("promotions")
    .select("id")
    .eq("type", type)
    .eq("target_id", targetId)
    .eq("is_active", true)
    .gt("expires_at", now)
    .limit(1)
    .maybeSingle();

  return Boolean(data);
}

export async function getActivePromotionTargetIds(
  client: DbClient,
  type: PromotionType,
  targetIds?: string[]
): Promise<Set<string>> {
  if (targetIds && targetIds.length === 0) return new Set();

  const now = new Date().toISOString();
  let query = client
    .from("promotions")
    .select("target_id")
    .eq("type", type)
    .eq("is_active", true)
    .gt("expires_at", now);

  if (targetIds) {
    query = query.in("target_id", targetIds);
  }

  const { data } = await query;
  return new Set((data ?? []).map((row) => row.target_id));
}

export async function deactivatePromotionsForTarget(
  client: DbClient,
  businessAccountId: string,
  targetId: string
): Promise<void> {
  const { error } = await client
    .from("promotions")
    .update({ is_active: false })
    .eq("business_account_id", businessAccountId)
    .eq("target_id", targetId)
    .eq("is_active", true);

  if (error) throw error;
}
