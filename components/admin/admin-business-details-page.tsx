"use client";

import { useState, useTransition } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { updateBusinessBilling } from "@/lib/actions/business";
import { cancelSubscription } from "@/lib/actions/payments";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { ActionFeedback } from "@/components/admin/ui/action-feedback";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import type { AdminBusinessDetails } from "@/lib/queries/business";
import type { BusinessBillingInfo } from "@/types";
import { SUBSCRIPTION_PRICE } from "@/lib/stripe/products";
import { formatMoney, isSubscriptionProduct } from "@/lib/utils/money";

type Props = {
  details: AdminBusinessDetails;
};

export function AdminBusinessDetailsPage({ details }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [billing, setBilling] = useState(details.billing);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const setField = (key: keyof BusinessBillingInfo, value: string) => {
    setBilling((current) => ({ ...current, [key]: value }));
  };

  const saveBilling = () => {
    startTransition(async () => {
      const result = await updateBusinessBilling(details.id, billing);
      if (result.success) {
        setFeedback({ type: "success", message: "Billing details saved." });
        router.refresh();
      } else {
        setFeedback({ type: "error", message: result.error });
      }
    });
  };

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelSubscription(details.id);
      setCancelOpen(false);
      if (result.success) {
        setFeedback({
          type: "success",
          message: "Subscription will cancel at period end.",
        });
        router.refresh();
      } else {
        setFeedback({ type: "error", message: result.error });
      }
    });
  };

  const sub = details.subscription;

  return (
    <div data-route="admin-business-details">
      <div className="mb-2">
        <Link
          href="/admin/users"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Users & businesses
        </Link>
      </div>
      <h1 className="font-heading text-2xl font-semibold md:text-3xl">
        {details.name}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {details.email} · {details.type} · joined {details.joinedAt}
      </p>
      <div className="mt-3">
        <AdminBadge status={details.status as "pending"}>
          {details.status}
        </AdminBadge>
      </div>

      {feedback ? (
        <div className="mt-4">
          <ActionFeedback message={feedback.message} type={feedback.type} />
        </div>
      ) : null}

      <AdminCard className="mt-8 space-y-4 p-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Billing details
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["legalName", "Legal name"],
              ["cui", "CUI"],
              ["billingAddress", "Address"],
              ["billingCity", "City"],
              ["billingCounty", "County"],
              ["billingPostalCode", "Postal code"],
              ["billingCountry", "Country"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-sm">
              <span className="text-xs text-muted-foreground">{label}</span>
              <input
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-foreground/30"
                value={billing[key]}
                onChange={(e) => setField(key, e.target.value)}
              />
            </label>
          ))}
        </div>
        <AdminButton
          size="md"
          onClick={saveBilling}
          pending={pending}
          pendingLabel="Saving…"
        >
          Save billing
        </AdminButton>
      </AdminCard>

      <AdminCard className="mt-6 space-y-3 p-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Subscription
        </h2>
        {!sub ? (
          <p className="text-sm text-muted-foreground">No subscription.</p>
        ) : (
          <>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Price</dt>
                <dd className="font-medium">
                  {formatMoney(
                    SUBSCRIPTION_PRICE.amount,
                    SUBSCRIPTION_PRICE.currency
                  )}
                  {sub.billingType === "one_time" ? " (one month)" : " / month"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Billing</dt>
                <dd className="font-medium">
                  {sub.billingType === "one_time" ? "One-time" : "Recurring"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd className="font-medium">
                  {sub.paymentFailed
                    ? "Payment failed"
                    : sub.cancelAtPeriodEnd
                      ? "Canceling"
                      : sub.status}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">
                  {sub.cancelAtPeriodEnd || sub.billingType === "one_time"
                    ? "Ends"
                    : "Renews"}
                </dt>
                <dd className="font-medium">{sub.renewsAt}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Promoted</dt>
                <dd>
                  {sub.promotedUsed}/{sub.promotedQuota}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Posts</dt>
                <dd>
                  {sub.postsUsed}/{sub.postsQuota}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Newsletters</dt>
                <dd>
                  {sub.newslettersUsed}/{sub.newslettersQuota}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Social</dt>
                <dd>
                  {sub.socialUsed}/{sub.socialQuota}
                </dd>
              </div>
            </dl>
            {!sub.canCancelRenewal ? (
              sub.entitled &&
              (sub.cancelAtPeriodEnd || sub.billingType === "one_time") ? (
                <p className="text-xs text-muted-foreground">
                  Auto-renewal already canceled. Access continues until{" "}
                  {sub.renewsAt}.
                </p>
              ) : null
            ) : (
              <AdminButton
                size="md"
                variant="danger"
                disabled={pending}
                onClick={() => setCancelOpen(true)}
              >
                Cancel subscription
              </AdminButton>
            )}
          </>
        )}
      </AdminCard>

      <AdminCard className="mt-6 p-6">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Recent payments
        </h2>
        {details.recentPayments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payments yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {details.recentPayments.map((payment) => (
              <li
                key={payment.id}
                className="flex items-center justify-between border-b border-border/40 py-2"
              >
                <span className="capitalize text-muted-foreground">
                  {payment.productType.replace(/_/g, " ")} · {payment.paidAt}
                </span>
                <span className="font-medium">
                  {formatMoney(
                    payment.amountCents,
                    isSubscriptionProduct(payment.productType)
                      ? "ron"
                      : payment.currency
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel subscription"
        description={`Stop auto-renewal for ${details.name}? They keep access until the current period ends.`}
        confirmLabel="Cancel renewal"
        confirmVariant="danger"
        onClose={() => setCancelOpen(false)}
        pending={pending}
        onConfirm={handleCancel}
      />
    </div>
  );
}
