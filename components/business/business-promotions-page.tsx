"use client";

import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { PendingButton } from "@/components/ui/pending-button";
import {
  createBillingPortalSession,
  createSubscriptionCheckout,
  purchasePromotion,
  cancelSubscription,
} from "@/lib/actions/payments";
import {
  PROMOTION_PRICES,
  SUBSCRIPTION_PRICE,
  PROMOTION_DURATION_DAYS,
} from "@/lib/stripe/products";
import type {
  BusinessPromotionRow,
  BusinessSubscriptionInfo,
} from "@/lib/queries/promotions";
import type { BusinessFeedPostItem } from "@/lib/queries/feed";
import type { EventListItem } from "@/types/events";
import type { PromotionType } from "@/types";

type BusinessEvent = EventListItem & { status: string };

type Props = {
  promotions: BusinessPromotionRow[];
  subscription: BusinessSubscriptionInfo;
  events: BusinessEvent[];
  feedPosts: BusinessFeedPostItem[];
  initialBoost?: PromotionType;
  initialTarget?: string;
  hasBusinessAccount: boolean;
  purchasesEnabled: boolean;
};

const ONE_TIME_PLANS: {
  type: PromotionType;
  description: string;
}[] = [
  {
    type: "event_boost",
    description: `Boost your event for ${PROMOTION_DURATION_DAYS} days — it appears separately as boosted on the calendar, map, and events section.`,
  },
  {
    type: "feed_post",
    description: "Pin your post to the top of What Did You Miss for 48h.",
  },
  {
    type: "newsletter",
    description: "Feature your venue in the weekly Firefly newsletter.",
  },
  {
    type: "social_media",
    description: "Dedicated post on Firefly social channels.",
  },
];

function formatPrice(amountCents: number, currency: string) {
  const value = amountCents / 100;
  if (currency === "ron") return `${Math.round(value)} lei`;
  return currency === "eur" ? `€${value}` : `${value} ${currency.toUpperCase()}`;
}

function getQuotaForType(
  sub: BusinessSubscriptionInfo,
  type: PromotionType
): { used: number; quota: number } | null {
  if (!sub) return null;
  switch (type) {
    case "event_boost":
      return { used: sub.promotedUsed, quota: sub.promotedQuota };
    case "feed_post":
      return { used: sub.postsUsed, quota: sub.postsQuota };
    case "newsletter":
      return { used: sub.newslettersUsed, quota: sub.newslettersQuota };
    case "social_media":
      return { used: sub.socialUsed, quota: sub.socialQuota };
  }
}

function formatPromotionType(type: PromotionType) {
  return PROMOTION_PRICES[type].label;
}

const TERMS_STORAGE_KEY = "firefly-promotions-accepted-terms";
const CHECKOUT_LEAVE_KEY = "firefly-promotions-checkout-leave";

function readAcceptedTerms(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(TERMS_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeAcceptedTerms(accepted: boolean) {
  try {
    if (accepted) sessionStorage.setItem(TERMS_STORAGE_KEY, "1");
    else sessionStorage.removeItem(TERMS_STORAGE_KEY);
  } catch {
    /* private mode / blocked storage */
  }
}

function markLeavingForCheckout() {
  try {
    sessionStorage.setItem(CHECKOUT_LEAVE_KEY, "1");
  } catch {
    /* private mode / blocked storage */
  }
}

function consumeLeavingForCheckout(): boolean {
  try {
    if (sessionStorage.getItem(CHECKOUT_LEAVE_KEY) !== "1") return false;
    sessionStorage.removeItem(CHECKOUT_LEAVE_KEY);
    return true;
  } catch {
    return false;
  }
}

function goToStripeCheckout(url: string) {
  markLeavingForCheckout();
  window.location.href = url;
}

export function BusinessPromotionsPage({
  promotions,
  subscription,
  events,
  feedPosts,
  initialBoost,
  initialTarget,
  hasBusinessAccount,
  purchasesEnabled,
}: Props) {
  const t = useTranslations("premium");
  const tAuth = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [autoRenew, setAutoRenew] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerType, setPickerType] = useState<PromotionType | null>(
    initialBoost ?? null
  );
  const [selectedTarget, setSelectedTarget] = useState(initialTarget ?? "");
  const [forceCheckout, setForceCheckout] = useState(false);

  const resetCheckoutUi = () => {
    setPendingAction(null);
    setPickerOpen(false);
    setError(null);
  };

  useEffect(() => {
    setAcceptedTerms(readAcceptedTerms());
  }, []);

  const checkoutCanceled = searchParams.get("canceled") === "true";

  useEffect(() => {
    if (!checkoutCanceled) return;
    resetCheckoutUi();
  }, [checkoutCanceled]);

  useEffect(() => {
    const handleReturnFromCheckout = () => {
      if (!consumeLeavingForCheckout()) return;

      const params = new URLSearchParams(window.location.search);
      if (
        params.get("success") === "true" ||
        params.get("subscription") === "success"
      ) {
        resetCheckoutUi();
        return;
      }

      // Always load a new document. setState cannot clear pending/picker
      // restored from bfcache — especially a second Back onto ?canceled=true.
      params.set("canceled", "true");
      const next = `${window.location.pathname}?${params.toString()}`;
      if (`${window.location.pathname}${window.location.search}` === next) {
        window.location.reload();
        return;
      }
      window.location.replace(next);
    };

    handleReturnFromCheckout();
    window.addEventListener("pageshow", handleReturnFromCheckout);
    window.addEventListener("popstate", handleReturnFromCheckout);
    return () => {
      window.removeEventListener("pageshow", handleReturnFromCheckout);
      window.removeEventListener("popstate", handleReturnFromCheckout);
    };
  }, []);

  const isPending = (action: string) => pendingAction === action;

  const publishedEvents = events.filter((e) => e.status === "published");
  const publishedPosts = feedPosts.filter((p) => p.status === "published");

  const checkoutFeedback = (() => {
    if (searchParams.get("success") === "true") {
      return { type: "success" as const, message: "Payment successful — your promotion is now active." };
    }
    if (searchParams.get("subscription") === "success") {
      return { type: "success" as const, message: t("activated") };
    }
    if (searchParams.get("canceled") === "true") {
      return { type: "error" as const, message: "Checkout was canceled." };
    }
    return null;
  })();

  const openPicker = (type: PromotionType, checkout = false) => {
    setError(null);
    setSuccessMessage(null);
    setPickerType(type);
    setForceCheckout(checkout);
    setSelectedTarget(
      type === initialBoost ? (initialTarget ?? "") : ""
    );
    setPickerOpen(true);
  };

  const canPurchase = purchasesEnabled && acceptedTerms;

  const runPurchase = async (
    type: PromotionType,
    targetId?: string,
    checkout = false,
    actionKey = `purchase:${type}:${checkout ? "pay" : "quota"}`
  ) => {
    if (!acceptedTerms) {
      setError(t("mustAcceptLegal"));
      return;
    }
    setError(null);
    setSuccessMessage(null);
    setPendingAction(actionKey);

    try {
      const result = await purchasePromotion(type, targetId, {
        forceCheckout: checkout,
        acceptedTerms: true,
      });

      if (!result.success) {
        setError(result.error);
        setPendingAction(null);
        return;
      }

      if (result.data.url) {
        goToStripeCheckout(result.data.url);
        return;
      }

      if (result.data.usedQuota) {
        setSuccessMessage("Promotion activated using your subscription slot.");
        setPickerOpen(false);
        setPendingAction(null);
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to purchase promotion");
      setPendingAction(null);
    }
  };

  const handlePlanClick = (type: PromotionType, checkout = false) => {
    if (!acceptedTerms) {
      setError(t("mustAcceptLegal"));
      return;
    }
    if (type === "event_boost" || type === "feed_post") {
      openPicker(type, checkout);
      return;
    }
    void runPurchase(type, undefined, checkout);
  };

  const handleSubscribe = async () => {
    if (!acceptedTerms) {
      setError(t("mustAcceptLegal"));
      return;
    }
    setError(null);
    setPendingAction("subscribe");
    try {
      const result = await createSubscriptionCheckout({
        autoRenew,
        acceptedTerms: true,
      });
      if (!result.success) {
        setError(result.error);
        setPendingAction(null);
        return;
      }
      goToStripeCheckout(result.data.url);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to create subscription checkout"
      );
      setPendingAction(null);
    }
  };

  const handleManageBilling = async () => {
    setError(null);
    setPendingAction("billing");
    try {
      const result = await createBillingPortalSession();
      if (!result.success) {
        setError(result.error);
        setPendingAction(null);
        return;
      }
      window.location.href = result.data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to open billing portal");
      setPendingAction(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm(t("cancelConfirm"))) {
      return;
    }
    setError(null);
    setPendingAction("cancel");
    try {
      const result = await cancelSubscription();
      if (!result.success) {
        setError(result.error);
        setPendingAction(null);
        return;
      }
      setSuccessMessage(t("canceledSuccess"));
      setPendingAction(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to cancel subscription");
      setPendingAction(null);
    }
  };

  const pickerTargets =
    pickerType === "event_boost"
      ? publishedEvents
          .filter((e) => !e.isPromoted)
          .map((e) => ({ id: e.id, label: e.title }))
      : pickerType === "feed_post"
        ? publishedPosts
            .filter((p) => !p.isPromoted)
            .map((p) => ({ id: p.id, label: p.title }))
        : [];

  const effectiveSelectedTarget = pickerTargets.some(
    (target) => target.id === selectedTarget
  )
    ? selectedTarget
    : "";

  const pickerQuota =
    pickerType && subscription?.entitled
      ? getQuotaForType(subscription, pickerType)
      : null;

  if (!hasBusinessAccount) {
    return (
      <div data-route="business-promotions">
          <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
            ◦ Business · Promotions
          </div>
          <h1 className="font-heading text-4xl font-bold">
            Boost your <span className="text-gradient-firefly">nights</span>
          </h1>
          <div className="glass mt-10 rounded-2xl p-8 text-center">
            <p className="text-sm text-foreground/60">
              Register and get your business account approved to purchase
              promotions.
            </p>
            <Link
              href="/business"
              className="mt-4 inline-flex rounded-full bg-firefly px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Go to business dashboard
            </Link>
          </div>
      </div>
    );
  }

  return (
    <div data-route="business-promotions">
        <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
          ◦ Business · Promotions
        </div>
        <h1 className="font-heading text-4xl font-bold">
          Boost your <span className="text-gradient-firefly">nights</span>
        </h1>

        {checkoutFeedback ? (
          <p
            className={`mt-4 rounded-xl px-4 py-3 text-sm ${
              checkoutFeedback.type === "success"
                ? "bg-firefly/10 text-firefly"
                : "bg-destructive/10 text-destructive"
            }`}
            role="status"
          >
            {checkoutFeedback.message}
          </p>
        ) : null}

        {successMessage ? (
          <p
            className="mt-4 rounded-xl bg-firefly/10 px-4 py-3 text-sm text-firefly"
            role="status"
          >
            {successMessage}
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {!purchasesEnabled ? (
          <p className="mt-4 rounded-xl bg-foreground/5 px-4 py-3 text-sm text-foreground/60">
            Purchases require Supabase and Stripe to be configured. Set up your
            environment variables to enable checkout.
          </p>
        ) : null}

        {subscription ? (
          <div className="glass mt-8 rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-heading text-lg font-semibold">
                {subscription.paymentFailed
                  ? t("statusPaymentFailed")
                  : t("statusActive")}
              </h2>
              <span
                className={`font-mono text-xs uppercase tracking-wider-2 ${
                  subscription.paymentFailed ? "text-destructive" : "text-firefly"
                }`}
              >
                {subscription.paymentFailed
                  ? t("paymentFailedLabel")
                  : subscription.cancelAtPeriodEnd ||
                      subscription.billingType === "one_time"
                    ? t("expiresOn", { date: subscription.renewsAt })
                    : t("nextPayment", { date: subscription.renewsAt })}
              </span>
            </div>
            <p className="mt-1 text-sm text-foreground/60">{t("priceMonthly")}</p>
            {subscription.entitled ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <QuotaMeter
                  label="Event boosts"
                  used={subscription.promotedUsed}
                  quota={subscription.promotedQuota}
                />
                <QuotaMeter
                  label="What Did You Miss posts"
                  used={subscription.postsUsed}
                  quota={subscription.postsQuota}
                />
                <QuotaMeter
                  label="Newsletters"
                  used={subscription.newslettersUsed}
                  quota={subscription.newslettersQuota}
                />
                <QuotaMeter
                  label="Social posts"
                  used={subscription.socialUsed}
                  quota={subscription.socialQuota}
                />
              </div>
            ) : (
              <p className="mt-4 text-sm text-foreground/60">
                {t("benefitsPaused")}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              {subscription.paymentFailed || subscription.canManageBilling ? (
                <PendingButton
                  type="button"
                  onClick={handleManageBilling}
                  pending={isPending("billing")}
                  pendingLabel={t("openingBilling")}
                  disabled={!purchasesEnabled}
                  className="rounded-full bg-firefly px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  {subscription.paymentFailed
                    ? t("updatePayment")
                    : t("manageBilling")}
                </PendingButton>
              ) : null}
              {subscription.canCancelRenewal ? (
                <PendingButton
                  type="button"
                  onClick={handleCancelSubscription}
                  pending={isPending("cancel")}
                  pendingLabel={t("canceling")}
                  disabled={!purchasesEnabled}
                  className="text-sm text-destructive/80 underline-offset-2 hover:underline"
                >
                  {t("cancelRenewal")}
                </PendingButton>
              ) : subscription.entitled &&
                (subscription.cancelAtPeriodEnd ||
                  subscription.billingType === "one_time") ? (
                <p className="text-sm text-foreground/60">
                  {t("canceledNotice", { date: subscription.renewsAt })}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ONE_TIME_PLANS.map((plan) => {
            const opensPicker =
              plan.type === "event_boost" || plan.type === "feed_post";
            const price = PROMOTION_PRICES[plan.type];
            const quota = getQuotaForType(subscription, plan.type);
            const hasQuota =
              Boolean(subscription?.entitled) &&
              quota &&
              quota.used < quota.quota;

            return (
              <div key={plan.type} className="glass rounded-2xl p-5">
                <div className="font-heading text-lg font-semibold">
                  {price.label}
                </div>
                <div className="mt-2 text-2xl font-bold text-firefly">
                  {formatPrice(price.amount, price.currency)}
                </div>
                <p className="mt-2 text-sm text-foreground/65">
                  {plan.description}
                </p>
                <div className="mt-4 space-y-2">
                  {hasQuota ? (
                    <PendingButton
                      type="button"
                      pending={
                        opensPicker
                          ? false
                          : isPending(`purchase:${plan.type}:quota`)
                      }
                      pendingLabel="Applying…"
                      disabled={!canPurchase}
                      onClick={() => handlePlanClick(plan.type, false)}
                      className="w-full rounded-full bg-firefly py-2 text-sm font-medium text-primary-foreground"
                    >
                      Use included slot ({quota!.quota - quota!.used} left)
                    </PendingButton>
                  ) : null}
                  <PendingButton
                    type="button"
                    pending={
                      opensPicker
                        ? false
                        : isPending(`purchase:${plan.type}:pay`)
                    }
                    pendingLabel="Redirecting to checkout…"
                    disabled={!canPurchase}
                    onClick={() => handlePlanClick(plan.type, true)}
                    className="w-full rounded-full border border-firefly/30 py-2 text-sm text-firefly hover:bg-firefly/10"
                  >
                    {hasQuota
                      ? `Pay ${formatPrice(price.amount, price.currency)} instead`
                      : "Purchase"}
                  </PendingButton>
                </div>
              </div>
            );
          })}

          <div className="glass rounded-2xl p-5 sm:col-span-2 lg:col-span-1">
            <div className="font-heading text-lg font-semibold">
              {t("cardTitle")}
            </div>
            <div className="mt-2 text-2xl font-bold text-firefly">
              {formatPrice(SUBSCRIPTION_PRICE.amount, SUBSCRIPTION_PRICE.currency)}
            </div>
            <p className="mt-2 text-sm text-foreground/65">{t("included")}</p>
            {subscription?.entitled || subscription?.paymentFailed ? (
              <PendingButton
                type="button"
                pending={false}
                pendingLabel={t("redirecting")}
                disabled
                className="mt-4 w-full rounded-full border border-firefly/30 py-2 text-sm text-firefly/50"
              >
                {subscription.paymentFailed ? t("paymentFailedLabel") : t("subscribed")}
              </PendingButton>
            ) : (
              <>
                <label className="mt-4 flex items-start gap-2 text-sm text-foreground/80">
                  <input
                    type="checkbox"
                    checked={autoRenew}
                    onChange={(event) => setAutoRenew(event.target.checked)}
                    className="mt-0.5 accent-firefly"
                  />
                  <span>{t("autoRenew")}</span>
                </label>
                {autoRenew ? (
                  <p className="mt-2 text-xs text-foreground/55">
                    {t("autoRenewDetails")}
                  </p>
                ) : null}
                <PendingButton
                  type="button"
                  pending={isPending("subscribe")}
                  pendingLabel={t("redirecting")}
                  disabled={!canPurchase}
                  onClick={handleSubscribe}
                  className="mt-4 w-full rounded-full border border-firefly/30 py-2 text-sm text-firefly hover:bg-firefly/10"
                >
                  {t("continueToCheckout")}
                </PendingButton>
              </>
            )}
          </div>
        </div>

        <label className="mt-6 flex items-start gap-2 text-sm text-foreground/80">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) => {
              const checked = event.target.checked;
              setAcceptedTerms(checked);
              writeAcceptedTerms(checked);
            }}
            className="mt-0.5 accent-firefly"
            required
          />
          <span>
            {tAuth("agreeTermsPrefix")}{" "}
            <Link
              href="/terms"
              className="text-firefly/90 underline-offset-2 hover:underline"
            >
              {tAuth("termsLink")}
            </Link>{" "}
            {tAuth("agreeTermsMiddle")}{" "}
            <Link
              href="/privacy"
              className="text-firefly/90 underline-offset-2 hover:underline"
            >
              {tAuth("privacyLink")}
            </Link>
            .
          </span>
        </label>

        {promotions.length > 0 ? (
          <div className="mt-12">
            <h2 className="mb-4 font-heading text-xl font-semibold">
              Your active boosts
            </h2>
            <ul className="space-y-3">
              {promotions.map((promo) => (
                <li key={promo.id} className="glass rounded-2xl p-4 text-sm">
                  <span className="font-medium capitalize">
                    {formatPromotionType(promo.type)}
                  </span>
                  {" · "}
                  {promo.targetLabel}
                  {" · until "}
                  {promo.expiresAt}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

      {pickerOpen && pickerType ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface-1 p-6 shadow-2xl">
            <h3 className="font-heading text-lg font-semibold capitalize">
              Select {formatPromotionType(pickerType)}
            </h3>
            <p className="mt-1 text-sm text-foreground/60">
              Choose a published{" "}
              {pickerType === "event_boost"
                ? "event"
                : "What Did You Miss post"}{" "}
              to promote.
            </p>

            {pickerTargets.length === 0 ? (
              <p className="mt-4 text-sm text-foreground/50">
                No published{" "}
                {pickerType === "event_boost"
                  ? "events"
                  : "What Did You Miss posts"}{" "}
                available to boost. Items with an active boost appear again
                after it expires.
              </p>
            ) : (
              <select
                value={effectiveSelectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
                className="mt-4 w-full rounded-xl border border-firefly/20 bg-surface-2 px-3.5 py-2.5 text-sm"
              >
                <option value="">Select…</option>
                {pickerTargets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              {pickerQuota && pickerQuota.used < pickerQuota.quota && !forceCheckout ? (
                <PendingButton
                  type="button"
                  pending={isPending(`purchase:${pickerType}:quota`)}
                  pendingLabel="Applying…"
                  disabled={!canPurchase || !effectiveSelectedTarget}
                  onClick={() => void runPurchase(pickerType, effectiveSelectedTarget, false)}
                  className="rounded-full bg-firefly px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  Use slot ({pickerQuota.quota - pickerQuota.used} left)
                </PendingButton>
              ) : (
                <PendingButton
                  type="button"
                  pending={isPending(`purchase:${pickerType}:pay`)}
                  pendingLabel="Redirecting to checkout…"
                  disabled={!canPurchase || !effectiveSelectedTarget}
                  onClick={() => void runPurchase(pickerType, effectiveSelectedTarget, true)}
                  className="rounded-full bg-firefly px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  Purchase
                </PendingButton>
              )}
              {pickerQuota &&
              pickerQuota.used < pickerQuota.quota &&
              !forceCheckout ? (
                <PendingButton
                  type="button"
                  pending={isPending(`purchase:${pickerType}:pay`)}
                  pendingLabel="Redirecting to checkout…"
                  disabled={!canPurchase || !effectiveSelectedTarget}
                  onClick={() => void runPurchase(pickerType, effectiveSelectedTarget, true)}
                  className="rounded-full border border-firefly/30 px-4 py-2 text-sm text-firefly"
                >
                  Pay instead
                </PendingButton>
              ) : null}
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="rounded-full px-4 py-2 text-sm text-foreground/50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function QuotaMeter({
  label,
  used,
  quota,
}: {
  label: string;
  used: number;
  quota: number;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs text-foreground/60">
        <span>{label}</span>
        <span>
          {used}/{quota}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/10">
        <div
          className="h-full rounded-full bg-firefly transition-all"
          style={{ width: `${quota > 0 ? (used / quota) * 100 : 0}%` }}
        />
      </div>
    </div>
  );
}
