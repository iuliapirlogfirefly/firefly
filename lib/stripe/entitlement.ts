export type BillingType = "one_time" | "recurring";

export type SubscriptionEntitlement = {
  status: string;
  current_period_end: string | null;
};

const ENTITLED_STATUSES = new Set(["active", "past_due", "trialing"]);
const PAYMENT_FAILED_STATUSES = new Set(["past_due", "unpaid"]);

export function isPeriodOpen(periodEnd: string | null | undefined): boolean {
  if (!periodEnd) return false;
  return new Date(periodEnd).getTime() > Date.now();
}

export function isPremiumEntitled(
  sub: SubscriptionEntitlement | null | undefined
): boolean {
  if (!sub) return false;
  if (!ENTITLED_STATUSES.has(sub.status)) return false;
  return isPeriodOpen(sub.current_period_end);
}

export function isPaymentFailedStatus(status: string): boolean {
  return PAYMENT_FAILED_STATUSES.has(status);
}

export function hasBlockingPremium(
  sub: SubscriptionEntitlement | null | undefined
): boolean {
  if (!sub) return false;
  if (isPremiumEntitled(sub)) return true;
  return sub.status === "unpaid" || sub.status === "incomplete";
}

export function addOneMonth(from = new Date()): Date {
  const end = new Date(from);
  end.setMonth(end.getMonth() + 1);
  return end;
}

export function parseBillingType(value: string | null | undefined): BillingType {
  return value === "one_time" ? "one_time" : "recurring";
}
