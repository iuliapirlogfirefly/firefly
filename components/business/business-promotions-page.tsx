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
import type { FeedPostCreditBalance } from "@/lib/stripe/feed-post-credits";
import type { EventListItem } from "@/types/events";
import type { PromotionType } from "@/types";

type BusinessEvent = EventListItem & { status: string };

type Props = {
  promotions: BusinessPromotionRow[];
  subscription: BusinessSubscriptionInfo;
  events: BusinessEvent[];
  feedPostCredits: FeedPostCreditBalance;
  initialBoost?: PromotionType;
  initialTarget?: string;
  hasBusinessAccount: boolean;
  purchasesEnabled: boolean;
};

const ONE_TIME_PLANS: PromotionType[] = [
  "event_boost",
  "feed_post",
  "newsletter",
  "social_media",
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
  feedPostCredits,
  initialBoost,
  initialTarget,
  hasBusinessAccount,
  purchasesEnabled,
}: Props) {
  const t = useTranslations("business");
  const tPremium = useTranslations("premium");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
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

  const planDescription = (type: PromotionType) => {
    switch (type) {
      case "event_boost":
        return t("planEventBoost", { days: PROMOTION_DURATION_DAYS });
      case "feed_post":
        return t("planFeedPost");
      case "newsletter":
        return t("planNewsletter");
      case "social_media":
        return t("planSocialMedia");
    }
  };

  const checkoutFeedback = (() => {
    if (searchParams.get("success") === "true") {
      return {
        type: "success" as const,
        message:
          searchParams.get("pack") === "feed_post"
            ? t("packPaymentSuccess")
            : t("paymentSuccess"),
      };
    }
    if (searchParams.get("subscription") === "success") {
      return { type: "success" as const, message: tPremium("activated") };
    }
    if (searchParams.get("canceled") === "true") {
      return { type: "error" as const, message: t("checkoutCanceled") };
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
      setError(tPremium("mustAcceptLegal"));
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
        setSuccessMessage(t("quotaActivated"));
        setPickerOpen(false);
        setPendingAction(null);
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("purchaseFailed"));
      setPendingAction(null);
    }
  };

  const handlePlanClick = (type: PromotionType, checkout = false) => {
    if (!acceptedTerms) {
      setError(tPremium("mustAcceptLegal"));
      return;
    }
    if (type === "event_boost") {
      openPicker(type, checkout);
      return;
    }
    void runPurchase(type, undefined, type === "feed_post" ? true : checkout);
  };

  const handleSubscribe = async () => {
    if (!acceptedTerms) {
      setError(tPremium("mustAcceptLegal"));
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
        e instanceof Error ? e.message : t("subscribeFailed")
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
      setError(e instanceof Error ? e.message : t("billingFailed"));
      setPendingAction(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm(tPremium("cancelConfirm"))) {
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
      setSuccessMessage(tPremium("canceledSuccess"));
      setPendingAction(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("cancelFailed"));
      setPendingAction(null);
    }
  };

  const pickerTargets =
    pickerType === "event_boost"
      ? publishedEvents
          .filter((e) => !e.isPromoted)
          .map((e) => ({ id: e.id, label: e.title }))
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
            {t("promotionsEyebrow")}
          </div>
          <h1 className="font-heading text-4xl font-bold">
            {t.rich("promotionsHeadline", {
              glow: (chunks) => (
                <span className="text-gradient-firefly">{chunks}</span>
              ),
            })}
          </h1>
          <div className="glass mt-10 rounded-2xl p-8 text-center">
            <p className="text-sm text-foreground/60">
              {t("needsApproval")}
            </p>
            <Link
              href="/business"
              className="mt-4 inline-flex rounded-full bg-firefly px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              {t("goToDashboard")}
            </Link>
          </div>
      </div>
    );
  }

  return (
    <div data-route="business-promotions">
        <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
          {t("promotionsEyebrow")}
        </div>
        <h1 className="font-heading text-4xl font-bold">
          {t.rich("promotionsHeadline", {
            glow: (chunks) => (
              <span className="text-gradient-firefly">{chunks}</span>
            ),
          })}
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
            {t("purchasesDisabled")}
          </p>
        ) : null}

        {subscription ? (
          <div className="glass mt-8 rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-heading text-lg font-semibold">
                {subscription.paymentFailed
                  ? tPremium("statusPaymentFailed")
                  : tPremium("statusActive")}
              </h2>
              <span
                className={`font-mono text-xs uppercase tracking-wider-2 ${
                  subscription.paymentFailed ? "text-destructive" : "text-firefly"
                }`}
              >
                {subscription.paymentFailed
                  ? tPremium("paymentFailedLabel")
                  : subscription.cancelAtPeriodEnd ||
                      subscription.billingType === "one_time"
                    ? tPremium("expiresOn", { date: subscription.renewsAt })
                    : tPremium("nextPayment", { date: subscription.renewsAt })}
              </span>
            </div>
            <p className="mt-1 text-sm text-foreground/60">{tPremium("priceMonthly")}</p>
            {subscription.entitled ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <QuotaMeter
                  label={t("quotaEventBoosts")}
                  used={subscription.promotedUsed}
                  quota={subscription.promotedQuota}
                />
                <QuotaMeter
                  label={t("quotaFeedPosts")}
                  used={subscription.postsUsed}
                  quota={subscription.postsQuota}
                />
                <QuotaMeter
                  label={t("quotaNewsletters")}
                  used={subscription.newslettersUsed}
                  quota={subscription.newslettersQuota}
                />
                <QuotaMeter
                  label={t("quotaSocialPosts")}
                  used={subscription.socialUsed}
                  quota={subscription.socialQuota}
                />
              </div>
            ) : (
              <p className="mt-4 text-sm text-foreground/60">
                {tPremium("benefitsPaused")}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              {subscription.paymentFailed || subscription.canManageBilling ? (
                <PendingButton
                  type="button"
                  onClick={handleManageBilling}
                  pending={isPending("billing")}
                  pendingLabel={tPremium("openingBilling")}
                  disabled={!purchasesEnabled}
                  className="rounded-full bg-firefly px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  {subscription.paymentFailed
                    ? tPremium("updatePayment")
                    : tPremium("manageBilling")}
                </PendingButton>
              ) : null}
              {subscription.canCancelRenewal ? (
                <PendingButton
                  type="button"
                  onClick={handleCancelSubscription}
                  pending={isPending("cancel")}
                  pendingLabel={tPremium("canceling")}
                  disabled={!purchasesEnabled}
                  className="text-sm text-destructive/80 underline-offset-2 hover:underline"
                >
                  {tPremium("cancelRenewal")}
                </PendingButton>
              ) : subscription.entitled &&
                (subscription.cancelAtPeriodEnd ||
                  subscription.billingType === "one_time") ? (
                <p className="text-sm text-foreground/60">
                  {tPremium("canceledNotice", { date: subscription.renewsAt })}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ONE_TIME_PLANS.map((planType) => {
            const opensPicker = planType === "event_boost";
            const price = PROMOTION_PRICES[planType];
            const quota = getQuotaForType(subscription, planType);
            const hasQuota =
              planType !== "feed_post" &&
              Boolean(subscription?.entitled) &&
              quota &&
              quota.used < quota.quota;
            const formattedPrice = formatPrice(price.amount, price.currency);
            const canCreateFromSlots =
              planType === "feed_post" && feedPostCredits.remaining > 0;

            return (
              <div key={planType} className="glass rounded-2xl p-5">
                <div className="font-heading text-lg font-semibold">
                  {tCommon(`products.${planType}`)}
                </div>
                <div className="mt-2 text-2xl font-bold text-firefly">
                  {t("priceLei", { amount: Math.round(price.amount / 100) })}
                </div>
                <p className="mt-2 text-sm text-foreground/65">
                  {planDescription(planType)}
                </p>
                {planType === "feed_post" ? (
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-wider-2 text-foreground/45">
                    {t("packAndPremiumSlots", {
                      packUsed: feedPostCredits.packUsed,
                      packQuota: feedPostCredits.packQuota,
                      premiumUsed: feedPostCredits.premiumUsed,
                      premiumQuota: feedPostCredits.premiumQuota,
                    })}
                  </p>
                ) : null}
                <div className="mt-4 space-y-2">
                  {canCreateFromSlots ? (
                    <Link
                      href="/business/posts"
                      className="flex w-full items-center justify-center rounded-full bg-firefly py-2 text-sm font-medium text-primary-foreground"
                    >
                      {t("createPostWithSlots", {
                        count: feedPostCredits.remaining,
                      })}
                    </Link>
                  ) : null}
                  {hasQuota ? (
                    <PendingButton
                      type="button"
                      pending={
                        opensPicker
                          ? false
                          : isPending(`purchase:${planType}:quota`)
                      }
                      pendingLabel={t("applying")}
                      disabled={!canPurchase}
                      onClick={() => handlePlanClick(planType, false)}
                      className="w-full rounded-full bg-firefly py-2 text-sm font-medium text-primary-foreground"
                    >
                      {t("useIncludedSlot", { count: quota!.quota - quota!.used })}
                    </PendingButton>
                  ) : null}
                  <PendingButton
                    type="button"
                    pending={
                      opensPicker
                        ? false
                        : isPending(`purchase:${planType}:pay`)
                    }
                    pendingLabel={tPremium("redirecting")}
                    disabled={!canPurchase}
                    onClick={() => handlePlanClick(planType, true)}
                    className="w-full rounded-full border border-firefly/30 py-2 text-sm text-firefly hover:bg-firefly/10"
                  >
                    {planType === "feed_post"
                      ? t("buyPostPack")
                      : hasQuota
                        ? t("payInstead", { price: formattedPrice })
                        : t("purchase")}
                  </PendingButton>
                </div>
              </div>
            );
          })}

          <div className="glass rounded-2xl p-5 sm:col-span-2 lg:col-span-1">
            <div className="font-heading text-lg font-semibold">
              {tPremium("cardTitle")}
            </div>
            <div className="mt-2 text-2xl font-bold text-firefly">
              {formatPrice(SUBSCRIPTION_PRICE.amount, SUBSCRIPTION_PRICE.currency)}
            </div>
            <p className="mt-2 text-sm text-foreground/65">{tPremium("included")}</p>
            {subscription?.entitled || subscription?.paymentFailed ? (
              <PendingButton
                type="button"
                pending={false}
                pendingLabel={tPremium("redirecting")}
                disabled
                className="mt-4 w-full rounded-full border border-firefly/30 py-2 text-sm text-firefly/50"
              >
                {subscription.paymentFailed ? tPremium("paymentFailedLabel") : tPremium("subscribed")}
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
                  <span>{tPremium("autoRenew")}</span>
                </label>
                {autoRenew ? (
                  <p className="mt-2 text-xs text-foreground/55">
                    {tPremium("autoRenewDetails")}
                  </p>
                ) : null}
                <PendingButton
                  type="button"
                  pending={isPending("subscribe")}
                  pendingLabel={tPremium("redirecting")}
                  disabled={!canPurchase}
                  onClick={handleSubscribe}
                  className="mt-4 w-full rounded-full border border-firefly/30 py-2 text-sm text-firefly hover:bg-firefly/10"
                >
                  {tPremium("continueToCheckout")}
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
              {t("activeBoostsTitle")}
            </h2>
            <ul className="space-y-3">
              {promotions.map((promo) => (
                <li key={promo.id} className="glass rounded-2xl p-4 text-sm">
                  {t("activeBoostItem", {
                    type: tCommon(`products.${promo.type}`),
                    target: promo.targetLabel,
                    date: promo.expiresAt,
                  })}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

      {pickerOpen && pickerType ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface-1 p-6 shadow-2xl">
            <h3 className="font-heading text-lg font-semibold">
              {t("pickerTitle", { type: tCommon(`products.${pickerType}`) })}
            </h3>
            <p className="mt-1 text-sm text-foreground/60">
              {t("pickerHintEvent")}
            </p>

            {pickerTargets.length === 0 ? (
              <p className="mt-4 text-sm text-foreground/50">
                {t("pickerEmptyEvents")}
              </p>
            ) : (
              <select
                value={effectiveSelectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
                className="mt-4 w-full rounded-xl border border-firefly/20 bg-surface-2 px-3.5 py-2.5 text-sm"
              >
                <option value="">{tCommon("selectEllipsis")}</option>
                {pickerTargets.map((target) => (
                  <option key={target.id} value={target.id}>
                    {target.label}
                  </option>
                ))}
              </select>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              {pickerQuota && pickerQuota.used < pickerQuota.quota && !forceCheckout ? (
                <PendingButton
                  type="button"
                  pending={isPending(`purchase:${pickerType}:quota`)}
                  pendingLabel={t("applying")}
                  disabled={!canPurchase || !effectiveSelectedTarget}
                  onClick={() => void runPurchase(pickerType, effectiveSelectedTarget, false)}
                  className="rounded-full bg-firefly px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  {t("useSlot", { count: pickerQuota.quota - pickerQuota.used })}
                </PendingButton>
              ) : (
                <PendingButton
                  type="button"
                  pending={isPending(`purchase:${pickerType}:pay`)}
                  pendingLabel={tPremium("redirecting")}
                  disabled={!canPurchase || !effectiveSelectedTarget}
                  onClick={() => void runPurchase(pickerType, effectiveSelectedTarget, true)}
                  className="rounded-full bg-firefly px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  {t("purchase")}
                </PendingButton>
              )}
              {pickerQuota &&
              pickerQuota.used < pickerQuota.quota &&
              !forceCheckout ? (
                <PendingButton
                  type="button"
                  pending={isPending(`purchase:${pickerType}:pay`)}
                  pendingLabel={tPremium("redirecting")}
                  disabled={!canPurchase || !effectiveSelectedTarget}
                  onClick={() => void runPurchase(pickerType, effectiveSelectedTarget, true)}
                  className="rounded-full border border-firefly/30 px-4 py-2 text-sm text-firefly"
                >
                  {t("payInsteadShort")}
                </PendingButton>
              ) : null}
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="rounded-full px-4 py-2 text-sm text-foreground/50"
              >
                {tCommon("cancel")}
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
