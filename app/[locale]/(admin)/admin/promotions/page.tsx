import { AdminPromotionsTable } from "@/components/admin/admin-promotions-table";
import { redirect } from "@/i18n/navigation";
import {
  buildAdminQuery,
  parsePage,
  totalPages,
} from "@/lib/admin/pagination";
import {
  getAdminPromotions,
  getAdminSubscriptions,
} from "@/lib/queries/promotions";
import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminPromotionsPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const page = parsePage(sp.page);
  const subsPage = parsePage(sp.subsPage);

  const [promotions, subscriptions] = await Promise.all([
    getAdminPromotions(page),
    getAdminSubscriptions(subsPage),
  ]);

  const promoLast = totalPages(promotions.total);
  const subsLast = totalPages(subscriptions.total);
  if (
    (page > 1 && (promotions.total === 0 || page > promoLast)) ||
    (subsPage > 1 && (subscriptions.total === 0 || subsPage > subsLast))
  ) {
    redirect({
      href: `/admin/promotions${buildAdminQuery({
        page:
          promotions.total === 0 || page > promoLast
            ? promotions.total === 0
              ? undefined
              : promoLast
            : page,
        subsPage:
          subscriptions.total === 0 || subsPage > subsLast
            ? subscriptions.total === 0
              ? undefined
              : subsLast
            : subsPage,
      })}`,
      locale,
    });
  }

  return (
    <AdminPromotionsTable
      promotions={promotions}
      subscriptions={subscriptions}
    />
  );
}
