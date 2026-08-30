import { AdminDeliveriesTable } from "@/components/admin/admin-deliveries-table";
import { getAdminDeliveries } from "@/lib/queries/promotions";
import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export default async function AdminDeliveriesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const deliveries = await getAdminDeliveries();

  return <AdminDeliveriesTable deliveries={deliveries} />;
}
