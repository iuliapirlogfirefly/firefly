import { getLocale, getTranslations } from "next-intl/server";
import { AdminMessageActions } from "@/components/admin/admin-message-actions";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminPagination } from "@/components/admin/ui/admin-pagination";
import { dateTimeLocale } from "@/lib/i18n/date-locale";
import type { Paginated } from "@/lib/admin/pagination";
import type { AdminContactMessage } from "@/lib/queries/contact";

type Props = {
  messages: Paginated<AdminContactMessage>;
  unreadCount: number;
};

export async function AdminMessagesQueue({ messages, unreadCount }: Props) {
  const t = await getTranslations("admin");
  const tStatus = await getTranslations("common.status");
  const locale = await getLocale();

  return (
    <div data-route="admin-messages">
      <h1 className="font-heading text-2xl font-semibold md:text-3xl">
        {t("messages")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {unreadCount > 0
          ? t("messagesSubtitleUnread", { count: unreadCount })
          : t("messagesSubtitle")}
      </p>

      <div className="mt-6 space-y-4">
        {messages.items.length === 0 ? (
          <AdminEmptyState
            title={t("allCaughtUp")}
            description={t("noMessages")}
          />
        ) : (
          messages.items.map((message) => (
            <AdminCard
              key={message.id}
              className={`p-5 ${
                message.status === "unread" ? "border-amber-500/30" : ""
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-medium">{message.businessName}</h2>
                    {message.status === "unread" ? (
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
                        {tStatus("unread")}
                      </span>
                    ) : (
                      <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted-foreground">
                        {tStatus("read")}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-medium text-foreground/90">
                    {message.subject}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                    {message.body}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {new Date(message.createdAt).toLocaleString(
                      dateTimeLocale(locale)
                    )}
                    {message.replyEmail ? ` · ${message.replyEmail}` : ""}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <AdminMessageActions
                  messageId={message.id}
                  status={message.status}
                  replyEmail={message.replyEmail}
                  subject={message.subject}
                />
              </div>
            </AdminCard>
          ))
        )}
        <AdminPagination
          pathname="/admin/messages"
          page={messages.page}
          total={messages.total}
        />
      </div>
    </div>
  );
}
