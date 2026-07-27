import { AdminMessagesQueue } from "@/components/admin/admin-messages-queue";
import { getAdminContactMessages } from "@/lib/queries/contact";
import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export default async function AdminMessagesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const messages = await getAdminContactMessages();

  return <AdminMessagesQueue messages={messages} />;
}
