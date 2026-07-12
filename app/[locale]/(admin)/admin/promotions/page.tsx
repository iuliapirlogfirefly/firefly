import { AdminPromotionsTable } from "@/components/admin/admin-promotions-table";
import {
  getAdminPromotions,
  getAdminSubscriptions,
} from "@/lib/queries/promotions";
import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export default async function AdminPromotionsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [promotions, subscriptions] = await Promise.all([
    getAdminPromotions(),
    getAdminSubscriptions(),
  ]);

  return (
    <AdminPromotionsTable
      promotions={promotions}
      subscriptions={subscriptions}
    />
  );
}
