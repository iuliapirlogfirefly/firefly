import { readStatusResult } from "@/lib/netopia/client";
import { verifyIpn } from "@/lib/netopia/ipn";
import {
  applyNetopiaPaymentUpdate,
  rememberNetopiaPayload,
} from "@/lib/billing/fulfill";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return Response.json({ received: true, skipped: "supabase_disabled" });
  }

  const rawBody = await request.text();
  const token = request.headers.get("verification-token") ?? "";

  try {
    verifyIpn(token, rawBody);
  } catch (error) {
    console.error("[netopia] IPN verification failed", error);
    return Response.json({ error: "invalid signature" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const status = readStatusResult(
    body && typeof body === "object" ? (body as Record<string, unknown>) : {}
  );

  try {
    if (status.orderId) {
      await applyNetopiaPaymentUpdate({
        orderId: status.orderId,
        status: status.status,
        ntpId: status.ntpId,
        amount: status.amount,
      });
    }
    await rememberNetopiaPayload(rawBody);
  } catch (error) {
    console.error("[netopia] IPN handling failed", error);
    return Response.json({ error: "processing failed" }, { status: 500 });
  }

  return Response.json({ received: true });
}
