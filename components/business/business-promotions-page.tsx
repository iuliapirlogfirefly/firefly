"use client";

import { Link } from "@/i18n/navigation";
import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createSubscriptionCheckout,
  purchasePromotion,
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
    description: `Glow brighter on the map for ${PROMOTION_DURATION_DAYS} days.`,
  },
  {
    type: "feed_post",
    description: "Pin your post to the top of the nightlife feed.",
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
  return type.replace(/_/g, " ");
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [pickerOpen, setPickerOpen] = useState(
    Boolean(
      initialBoost &&
        initialTarget &&
        (initialBoost === "event_boost" || initialBoost === "feed_post")
    )
  );
  const [pickerType, setPickerType] = useState<PromotionType | null>(
    initialBoost ?? null
  );
  const [selectedTarget, setSelectedTarget] = useState(initialTarget ?? "");
  const [forceCheckout, setForceCheckout] = useState(false);

  const publishedEvents = events.filter((e) => e.status === "published");
  const publishedPosts = feedPosts.filter((p) => p.status === "published");

  const checkoutFeedback = (() => {
    if (searchParams.get("success") === "true") {
      return { type: "success" as const, message: "Payment successful — your promotion is now active." };
    }
    if (searchParams.get("subscription") === "success") {
      return { type: "success" as const, message: "Subscription activated — your monthly slots are ready." };
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

  const runPurchase = (
    type: PromotionType,
    targetId?: string,
    checkout = false
  ) => {
    setError(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const result = await purchasePromotion(type, targetId, {
        forceCheckout: checkout,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (result.data.url) {
        window.location.href = result.data.url;
        return;
      }

      if (result.data.usedQuota) {
        setSuccessMessage("Promotion activated using your subscription slot.");
        setPickerOpen(false);
        router.refresh();
      }
    });
  };

  const handlePlanClick = (type: PromotionType, checkout = false) => {
    if (type === "event_boost" || type === "feed_post") {
      openPicker(type, checkout);
      return;
    }
    runPurchase(type, undefined, checkout);
  };

  const handleSubscribe = () => {
    setError(null);
    startTransition(async () => {
      const result = await createSubscriptionCheckout();
      if (!result.success) {
        setError(result.error);
        return;
      }
      window.location.href = result.data.url;
    });
  };

  const pickerTargets =
    pickerType === "event_boost"
      ? publishedEvents.map((e) => ({ id: e.id, label: e.title }))
      : pickerType === "feed_post"
        ? publishedPosts.map((p) => ({ id: p.id, label: p.title }))
        : [];

  const pickerQuota =
    pickerType && subscription ? getQuotaForType(subscription, pickerType) : null;

  const actionsDisabled = pending || !purchasesEnabled;

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
                Premium subscription
              </h2>
              <span className="font-mono text-xs uppercase tracking-wider-2 text-firefly">
                Renews {subscription.renewsAt}
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <QuotaMeter
                label="Event boosts"
                used={subscription.promotedUsed}
                quota={subscription.promotedQuota}
              />
              <QuotaMeter
                label="Feed posts"
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
          </div>
        ) : null}

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ONE_TIME_PLANS.map((plan) => {
            const price = PROMOTION_PRICES[plan.type];
            const quota = getQuotaForType(subscription, plan.type);
            const hasQuota =
              subscription && quota && quota.used < quota.quota;

            return (
              <div key={plan.type} className="glass rounded-2xl p-5">
                <div className="font-heading text-lg font-semibold capitalize">
                  {formatPromotionType(plan.type)}
                </div>
                <div className="mt-2 text-2xl font-bold text-firefly">
                  {formatPrice(price.amount, price.currency)}
                </div>
                <p className="mt-2 text-sm text-foreground/65">
                  {plan.description}
                </p>
                <div className="mt-4 space-y-2">
                  {hasQuota ? (
                    <button
                      type="button"
                      disabled={actionsDisabled}
                      onClick={() => handlePlanClick(plan.type, false)}
                      className="w-full rounded-full bg-firefly py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                    >
                      Use included slot ({quota!.quota - quota!.used} left)
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={actionsDisabled}
                    onClick={() => handlePlanClick(plan.type, !hasQuota)}
                    className={`w-full rounded-full py-2 text-sm ${
                      hasQuota
                        ? "border border-firefly/30 text-firefly hover:bg-firefly/10"
                        : "border border-firefly/30 text-firefly hover:bg-firefly/10"
                    } disabled:opacity-50`}
                  >
                    {hasQuota
                      ? `Pay ${formatPrice(price.amount, price.currency)} instead`
                      : "Purchase"}
                  </button>
                </div>
              </div>
            );
          })}

          <div className="glass rounded-2xl p-5 sm:col-span-2 lg:col-span-1">
            <div className="font-heading text-lg font-semibold">
              {SUBSCRIPTION_PRICE.label}
            </div>
            <div className="mt-2 text-2xl font-bold text-firefly">
              {formatPrice(SUBSCRIPTION_PRICE.amount, SUBSCRIPTION_PRICE.currency)}
              /mo
            </div>
            <p className="mt-2 text-sm text-foreground/65">
              4 promoted events, 4 feed posts, 2 newsletters, 2 social posts
              every month.
            </p>
            <button
              type="button"
              disabled={actionsDisabled || Boolean(subscription)}
              onClick={handleSubscribe}
              className="mt-4 w-full rounded-full border border-firefly/30 py-2 text-sm text-firefly hover:bg-firefly/10 disabled:opacity-50"
            >
              {subscription ? "Subscribed" : "Subscribe"}
            </button>
          </div>
        </div>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="glass w-full max-w-md rounded-2xl p-6">
            <h3 className="font-heading text-lg font-semibold capitalize">
              Select {formatPromotionType(pickerType)}
            </h3>
            <p className="mt-1 text-sm text-foreground/60">
              Choose a published{" "}
              {pickerType === "event_boost" ? "event" : "feed post"} to promote.
            </p>

            {pickerTargets.length === 0 ? (
              <p className="mt-4 text-sm text-foreground/50">
                No published{" "}
                {pickerType === "event_boost" ? "events" : "feed posts"} yet.
              </p>
            ) : (
              <select
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
                className="mt-4 w-full rounded-xl border border-firefly/20 bg-surface-1/50 px-3.5 py-2.5 text-sm"
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
                <button
                  type="button"
                  disabled={actionsDisabled || !selectedTarget}
                  onClick={() =>
                    runPurchase(pickerType, selectedTarget, false)
                  }
                  className="rounded-full bg-firefly px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  Use slot ({pickerQuota.quota - pickerQuota.used} left)
                </button>
              ) : (
                <button
                  type="button"
                  disabled={actionsDisabled || !selectedTarget}
                  onClick={() =>
                    runPurchase(pickerType, selectedTarget, true)
                  }
                  className="rounded-full bg-firefly px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  Purchase
                </button>
              )}
              {pickerQuota &&
              pickerQuota.used < pickerQuota.quota &&
              !forceCheckout ? (
                <button
                  type="button"
                  disabled={actionsDisabled || !selectedTarget}
                  onClick={() =>
                    runPurchase(pickerType, selectedTarget, true)
                  }
                  className="rounded-full border border-firefly/30 px-4 py-2 text-sm text-firefly disabled:opacity-50"
                >
                  Pay instead
                </button>
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
