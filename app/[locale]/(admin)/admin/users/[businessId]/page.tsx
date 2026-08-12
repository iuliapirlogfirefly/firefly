import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { AdminBusinessDetailsPage } from "@/components/admin/admin-business-details-page";
import { getAdminBusinessDetails } from "@/lib/queries/business";

type Props = {
  params: Promise<{ locale: "en" | "ro"; businessId: string }>;
};

export default async function AdminBusinessDetailsRoute({ params }: Props) {
  const { locale, businessId } = await params;
  setRequestLocale(locale);

  const details = await getAdminBusinessDetails(businessId);
  if (!details) notFound();

  return <AdminBusinessDetailsPage details={details} />;
}
