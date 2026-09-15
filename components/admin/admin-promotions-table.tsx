import { AdminInvoicedCheckbox } from "@/components/admin/admin-invoiced-checkbox";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { AdminCard } from "@/components/admin/ui/admin-card";
import type {
  AdminPromotionRow,
  AdminSubscriptionRow,
} from "@/lib/queries/promotions";
import { PROMOTION_PRICES, SUBSCRIPTION_PRICE } from "@/lib/stripe/products";
import type { PromotionType } from "@/types";
import { formatMoney } from "@/lib/utils/money";

type Props = {
  promotions: AdminPromotionRow[];
  subscriptions: AdminSubscriptionRow[];
  isMockMode?: boolean;
};

function formatPromotionType(type: string) {
  if (type in PROMOTION_PRICES) {
    return PROMOTION_PRICES[type as PromotionType].label;
  }
  return type.replace(/_/g, " ");
}

export function AdminPromotionsTable({
  promotions,
  subscriptions,
}: Props) {
  return (
    <div data-route="admin-promotions">
      <h1 className="font-heading text-2xl font-semibold md:text-3xl">
        Promotions
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Active promotions and premium subscriptions.
      </p>

      <section className="mt-8">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Active promotions
        </h2>
        {promotions.length === 0 ? (
          <AdminCard className="p-8 text-center text-sm text-muted-foreground">
            No active promotions.
          </AdminCard>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border bg-surface-1 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Business</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Target</th>
                  <th className="px-4 py-3 font-medium">Expires</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Invoiced</th>
                </tr>
              </thead>
              <tbody>
                {promotions.map((promo) => (
                  <tr
                    key={promo.id}
                    className="border-b border-border/50 hover:bg-surface-1/50"
                  >
                    <td className="px-4 py-3 font-medium">
                      {promo.businessName}
                    </td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">
                      {formatPromotionType(promo.type)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {promo.targetLabel}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {promo.expiresAt}
                    </td>
                    <td className="px-4 py-3">
                      <AdminBadge status={promo.isActive ? "active" : "default"}>
                        {promo.isActive ? "active" : "inactive"}
                      </AdminBadge>
                    </td>
                    <td className="px-4 py-3">
                      <AdminInvoicedCheckbox
                        kind="promotion"
                        id={promo.id}
                        invoiced={promo.invoiced}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Active subscriptions
        </h2>
        {subscriptions.length === 0 ? (
          <AdminCard className="p-8 text-center text-sm text-muted-foreground">
            No active subscriptions.
          </AdminCard>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="border-b border-border bg-surface-1 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Business</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Renews</th>
                  <th className="px-4 py-3 font-medium">Promoted</th>
                  <th className="px-4 py-3 font-medium">What Did You Miss</th>
                  <th className="px-4 py-3 font-medium">Newsletters</th>
                  <th className="px-4 py-3 font-medium">Social</th>
                  <th className="px-4 py-3 font-medium">
                    Invoiced
                    <span className="mt-0.5 block font-normal normal-case tracking-normal text-muted-foreground">
                      this period
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="border-b border-border/50 hover:bg-surface-1/50"
                  >
                    <td className="px-4 py-3 font-medium">
                      {sub.businessName}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatMoney(
                        SUBSCRIPTION_PRICE.amount,
                        SUBSCRIPTION_PRICE.currency
                      )}
                      {sub.billingType === "one_time" ? "" : " / month"}
                    </td>
                    <td className="px-4 py-3">
                      <AdminBadge
                        status={
                          sub.paymentFailed
                            ? "rejected"
                            : sub.entitled
                              ? "active"
                              : "default"
                        }
                      >
                        {sub.paymentFailed
                          ? "payment failed"
                          : sub.cancelAtPeriodEnd
                            ? "canceling"
                            : sub.status}
                      </AdminBadge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {sub.cancelAtPeriodEnd || sub.billingType === "one_time"
                        ? `Ends ${sub.renewsAt}`
                        : sub.renewsAt}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {sub.promotedUsed}/{sub.promotedQuota}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {sub.postsUsed}/{sub.postsQuota}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {sub.newslettersUsed}/{sub.newslettersQuota}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {sub.socialUsed}/{sub.socialQuota}
                    </td>
                    <td className="px-4 py-3">
                      <AdminInvoicedCheckbox
                        kind="subscription"
                        id={sub.id}
                        invoiced={sub.invoiced}
                        label="Invoiced this period"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
