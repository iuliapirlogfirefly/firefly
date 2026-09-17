"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
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

const BILLING_FIELDS = [
  ["legalName", "legalName"],
  ["cui", "cui"],
  ["billingAddress", "address"],
  ["billingCity", "city"],
  ["billingCounty", "county"],
  ["billingPostalCode", "postalCode"],
  ["billingCountry", "country"],
] as const;

export function AdminBusinessDetailsPage({ details }: Props) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const tProducts = useTranslations("common.products");
  const tStatus = useTranslations("common.status");
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
        setFeedback({ type: "success", message: t("billingSaved") });
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
          message: t("cancelSuccess"),
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
          {t("backUsers")}
        </Link>
      </div>
      <h1 className="font-heading text-2xl font-semibold md:text-3xl">
        {details.name}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("businessMeta", {
          email: details.email,
          type: details.type,
          date: details.joinedAt,
        })}
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
          {t("billingTitle")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {BILLING_FIELDS.map(([key, labelKey]) => (
            <label key={key} className="block text-sm">
              <span className="text-xs text-muted-foreground">
                {t(labelKey)}
              </span>
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
          pendingLabel={tCommon("saving")}
        >
          {t("saveBilling")}
        </AdminButton>
      </AdminCard>

      <AdminCard className="mt-6 space-y-3 p-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {t("subscriptionTitle")}
        </h2>
        {!sub ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t("noSubscription")}</p>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">
                  {t("colWhatDidYouMissPack")}
                </dt>
                <dd>
                  {details.packUsed}/{details.packQuota}
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">{t("price")}</dt>
                <dd className="font-medium">
                  {formatMoney(
                    SUBSCRIPTION_PRICE.amount,
                    SUBSCRIPTION_PRICE.currency
                  )}
                  {sub.billingType === "one_time" ? " (one month)" : " / month"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("billing")}</dt>
                <dd className="font-medium">
                  {sub.billingType === "one_time"
                    ? t("billingOneTime")
                    : t("billingRecurring")}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("status")}</dt>
                <dd className="font-medium">
                  {sub.paymentFailed
                    ? t("statusPaymentFailed")
                    : sub.cancelAtPeriodEnd
                      ? t("statusCanceling")
                      : tStatus.has(sub.status)
                        ? tStatus(sub.status)
                        : sub.status}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">
                  {sub.cancelAtPeriodEnd || sub.billingType === "one_time"
                    ? t("ends")
                    : t("renews")}
                </dt>
                <dd className="font-medium">{sub.renewsAt}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{tCommon("promoted")}</dt>
                <dd>
                  {sub.promotedUsed}/{sub.promotedQuota}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">
                  {t("colWhatDidYouMiss")}
                </dt>
                <dd>
                  {sub.postsUsed}/{sub.postsQuota}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">
                  {t("colWhatDidYouMissPack")}
                </dt>
                <dd>
                  {details.packUsed}/{details.packQuota}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("colNewsletters")}</dt>
                <dd>
                  {sub.newslettersUsed}/{sub.newslettersQuota}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("colSocial")}</dt>
                <dd>
                  {sub.socialUsed}/{sub.socialQuota}
                </dd>
              </div>
            </dl>
            {!sub.canCancelRenewal ? (
              sub.entitled &&
              (sub.cancelAtPeriodEnd || sub.billingType === "one_time") ? (
                <p className="text-xs text-muted-foreground">
                  {t("alreadyCanceled", { date: sub.renewsAt })}
                </p>
              ) : null
            ) : (
              <AdminButton
                size="md"
                variant="danger"
                disabled={pending}
                onClick={() => setCancelOpen(true)}
              >
                {t("cancelSubscription")}
              </AdminButton>
            )}
          </>
        )}
      </AdminCard>

      <AdminCard className="mt-6 p-6">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {t("recentPayments")}
        </h2>
        {details.recentPayments.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noPayments")}</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {details.recentPayments.map((payment) => {
              const productKey =
                payment.productType === "subscription" ||
                payment.productType === "premium_monthly"
                  ? "premium"
                  : payment.productType;
              return (
                <li
                  key={payment.id}
                  className="flex items-center justify-between border-b border-border/40 py-2"
                >
                  <span className="capitalize text-muted-foreground">
                    {tProducts.has(productKey)
                      ? tProducts(productKey)
                      : payment.productType.replace(/_/g, " ")}{" "}
                    · {payment.paidAt}
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
              );
            })}
          </ul>
        )}
      </AdminCard>

      <ConfirmDialog
        open={cancelOpen}
        title={t("cancelSubscription")}
        description={t("cancelDialogDescription", { name: details.name })}
        confirmLabel={t("cancelRenewal")}
        confirmVariant="danger"
        onClose={() => setCancelOpen(false)}
        pending={pending}
        onConfirm={handleCancel}
      />
    </div>
  );
}
