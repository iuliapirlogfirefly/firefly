"use client";

import { useRouter } from "@/i18n/navigation";
import { useState, useTransition } from "react";
import {
  archiveContactMessage,
  markContactMessageRead,
} from "@/lib/actions/admin";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { ActionFeedback } from "@/components/admin/ui/action-feedback";

type Props = {
  messageId: string;
  status: string;
  replyEmail: string | null;
  subject: string;
};

export function AdminMessageActions({
  messageId,
  status,
  replyEmail,
  subject,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const run = (
    action: () => Promise<{ success: boolean; error?: string }>,
    successMessage: string
  ) => {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        setFeedback({ type: "success", message: successMessage });
        router.refresh();
      } else {
        setFeedback({
          type: "error",
          message: result.error ?? "Action failed",
        });
      }
    });
  };

  const mailtoHref = replyEmail
    ? `mailto:${replyEmail}?subject=${encodeURIComponent(`Re: ${subject}`)}`
    : null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {status === "unread" ? (
          <AdminButton
            onClick={() =>
              run(() => markContactMessageRead(messageId), "Marked as read")
            }
            disabled={pending}
          >
            Mark read
          </AdminButton>
        ) : null}
        <AdminButton
          variant="secondary"
          onClick={() =>
            run(() => archiveContactMessage(messageId), "Archived")
          }
          disabled={pending}
        >
          Archive
        </AdminButton>
        {mailtoHref ? (
          <a
            href={mailtoHref}
            className="inline-flex items-center rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            Reply by email
          </a>
        ) : null}
      </div>
      {feedback ? (
        <ActionFeedback message={feedback.message} type={feedback.type} />
      ) : null}
    </div>
  );
}
