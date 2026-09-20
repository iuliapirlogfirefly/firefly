import { getTranslations } from "next-intl/server";
import { AdminInvoicedCheckbox } from "@/components/admin/admin-invoiced-checkbox";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminPagination } from "@/components/admin/ui/admin-pagination";
import type { Paginated } from "@/lib/admin/pagination";
import type {
  AdminPromotionRow,
  AdminSubscriptionRow,
} from "@/lib/queries/promotions";
import { SUBSCRIPTION_PRICE } from "@/lib/stripe/products";
import { formatMoney } from "@/lib/utils/money";

type Props = {
  promotions: Paginated<AdminPromotionRow>;
  subscriptions: Paginated<AdminSubscriptionRow>;
};

export async function AdminPromotionsTable({
  promotions,
  subscriptions,
}: Props) {
  const t = await getTranslations("admin");
  const tCommon = await getTranslations("common");
  const tProducts = await getTranslations("common.products");
  const tStatus = await getTranslations("common.status");

  return (
    <div data-route="admin-promotions">
      <h1 className="font-heading text-2xl font-semibold md:text-3xl">
        {t("promotions")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("promotionsSubtitle")}
      </p>

      <section className="mt-8">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {t("activePromotions")}
        </h2>
        {promotions.items.length === 0 ? (
          <AdminCard className="p-8 text-center text-sm text-muted-foreground">
            {t("noActivePromotions")}
          </AdminCard>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border bg-surface-1 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("colBusiness")}</th>
                  <th className="px-4 py-3 font-medium">{t("colType")}</th>
                  <th className="px-4 py-3 font-medium">{t("colTarget")}</th>
                  <th className="px-4 py-3 font-medium">{t("colExpires")}</th>
                  <th className="px-4 py-3 font-medium">{t("colStatus")}</th>
                  <th className="px-4 py-3 font-medium">{t("colInvoiced")}</th>
                </tr>
              </thead>
              <tbody>
                {promotions.items.map((promo) => (
                  <tr
                    key={promo.id}
                    className="border-b border-border/50 hover:bg-surface-1/50"
                  >
                    <td className="px-4 py-3 font-medium">
                      {promo.businessName}
                    </td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">
                      {tProducts.has(promo.type)
                        ? tProducts(promo.type)
                        : promo.type.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {promo.targetLabel}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {promo.expiresAt}
                    </td>
                    <td className="px-4 py-3">
                      <AdminBadge status={promo.isActive ? "active" : "default"}>
                        {promo.isActive ? tStatus("active") : tStatus("inactive")}
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
        <AdminPagination
          pathname="/admin/promotions"
          params={{ subsPage: subscriptions.page }}
          page={promotions.page}
          total={promotions.total}
        />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {t("activeSubscriptions")}
        </h2>
        {subscriptions.items.length === 0 ? (
          <AdminCard className="p-8 text-center text-sm text-muted-foreground">
            {t("noActiveSubscriptions")}
          </AdminCard>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="border-b border-border bg-surface-1 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("colBusiness")}</th>
                  <th className="px-4 py-3 font-medium">{t("colPrice")}</th>
                  <th className="px-4 py-3 font-medium">{t("colStatus")}</th>
                  <th className="px-4 py-3 font-medium">{t("colRenews")}</th>
                  <th className="px-4 py-3 font-medium">{tCommon("promoted")}</th>
                  <th className="px-4 py-3 font-medium">
                    {t("colWhatDidYouMiss")}
                  </th>
                  <th className="px-4 py-3 font-medium">{t("colNewsletters")}</th>
                  <th className="px-4 py-3 font-medium">{t("colSocial")}</th>
                  <th className="px-4 py-3 font-medium">
                    {t("colInvoiced")}
                    <span className="mt-0.5 block font-normal normal-case tracking-normal text-muted-foreground">
                      {t("invoicedThisPeriod")}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.items.map((sub) => (
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
                          ? t("statusPaymentFailed")
                          : sub.cancelAtPeriodEnd
                            ? t("statusCanceling")
                            : tStatus.has(sub.status)
                              ? tStatus(sub.status)
                              : sub.status}
                      </AdminBadge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {sub.cancelAtPeriodEnd || sub.billingType === "one_time"
                        ? `${t("ends")} ${sub.renewsAt}`
                        : sub.renewsAt}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {sub.promotedUsed}/{sub.promotedQuota}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div>
                        {sub.postsUsed}/{sub.postsQuota}
                      </div>
                      <div className="text-xs text-muted-foreground/70">
                        {t("packQuotaShort", {
                          used: sub.packUsed,
                          quota: sub.packQuota,
                        })}
                      </div>
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
                        label={t("invoicedThisPeriod")}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <AdminPagination
          pathname="/admin/promotions"
          params={{ page: promotions.page }}
          page={subscriptions.page}
          total={subscriptions.total}
          pageParam="subsPage"
        />
      </section>
    </div>
  );
}
