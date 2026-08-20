import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { PromotionType } from "@/types";
import { PROMOTION_DURATION_DAYS } from "./products";
import { hasActivePromotion } from "./promotions";

type AdminClient = SupabaseClient<Database>;

export type ActivatePromotionParams = {
  businessAccountId: string;
  type: PromotionType;
  targetId: string;
  stripePaymentId?: string | null;
};

export async function activatePromotion(
  admin: AdminClient,
  params: ActivatePromotionParams
): Promise<void> {
  const { businessAccountId, type, targetId, stripePaymentId } = params;

  if (await hasActivePromotion(admin, type, targetId)) {
    return;
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + PROMOTION_DURATION_DAYS);

  await admin.from("promotions").insert({
    business_account_id: businessAccountId,
    type,
    target_id: targetId,
    expires_at: expiresAt.toISOString(),
    stripe_payment_id: stripePaymentId ?? null,
    is_active: true,
  });

  if (type === "event_boost") {
    await admin
      .from("events")
      .update({ is_promoted: true, promotion_intensity: 3 })
      .eq("id", targetId);
  }
}
