import { getPaymentStatus } from "@/lib/netopia/client";
import {
  applyNetopiaPaymentUpdate,
  closeCanceledPayment,
} from "@/lib/billing/fulfill";
import { createAdminClient } from "@/lib/supabase/admin";

const ORDER_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function reconcileCheckoutReturn(params: {
  orderId: string | undefined;
  businessAccountId: string | null;
  canceled: boolean;
}): Promise<"paid" | "failed" | "pending" | null> {
  if (!params.orderId || !params.businessAccountId) return null;
  if (!ORDER_ID.test(params.orderId)) return null;

  const admin = createAdminClient();
  const { data: payment } = await admin
    .from("payments")
    .select("id, status, provider, provider_payment_id, business_account_id")
    .eq("id", params.orderId)
    .maybeSingle();

  if (!payment || payment.provider !== "netopia") return null;
  if (payment.business_account_id !== params.businessAccountId) return null;
  if (payment.status === "paid") return "paid";

  if (payment.provider_payment_id) {
    try {
      const remote = await getPaymentStatus(payment.provider_payment_id);
      await applyNetopiaPaymentUpdate({
        orderId: payment.id,
        status: remote.status,
        ntpId: remote.ntpId ?? payment.provider_payment_id,
        amount: remote.amount,
      });
    } catch (error) {
      console.error("[netopia] Could not reconcile payment status", error);
    }
  }

  if (params.canceled) {
    await closeCanceledPayment(params.orderId, params.businessAccountId);
  }

  const { data: current } = await admin
    .from("payments")
    .select("status")
    .eq("id", params.orderId)
    .maybeSingle();

  if (current?.status === "paid" || current?.status === "failed" || current?.status === "pending") {
    return current.status;
  }
  return null;
}
