import { AdminMessagesQueue } from "@/components/admin/admin-messages-queue";
import { redirect } from "@/i18n/navigation";
import {
  buildAdminQuery,
  parsePage,
  totalPages,
} from "@/lib/admin/pagination";
import {
  getAdminContactMessages,
  getUnreadContactMessageCount,
} from "@/lib/queries/contact";
import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminMessagesPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const page = parsePage(sp.page);
  const [messages, unreadCount] = await Promise.all([
    getAdminContactMessages(page),
    getUnreadContactMessageCount(),
  ]);

  if (page > 1 && (messages.total === 0 || page > totalPages(messages.total))) {
    redirect({
      href: `/admin/messages${buildAdminQuery({
        page: messages.total === 0 ? undefined : totalPages(messages.total),
      })}`,
      locale,
    });
  }

  return (
    <AdminMessagesQueue messages={messages} unreadCount={unreadCount} />
  );
}
