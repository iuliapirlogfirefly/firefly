"use client";

import { useState, useTransition } from "react";
import { sendNewsletter } from "@/lib/actions/admin";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { ActionFeedback } from "@/components/admin/ui/action-feedback";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";

type ArchiveItem = {
  id: string;
  subject: string;
  sentAt: string;
  recipients: number;
  opens: number;
};

type Props = {
  subscriberCount: number;
  archive: ArchiveItem[];
  isMockMode?: boolean;
};

export function AdminNewsletterComposer({
  subscriberCount,
  archive,
  isMockMode,
}: Props) {
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSend = () => {
    startTransition(async () => {
      const result = await sendNewsletter(subject, htmlContent);
      setConfirmOpen(false);
      if (result.success) {
        setFeedback({
          type: "success",
          message: `Sent to ${result.data.sent.toLocaleString()} subscribers`,
        });
        setSubject("");
        setHtmlContent("");
      } else {
        setFeedback({ type: "error", message: result.error });
      }
    });
  };

  return (
    <div data-route="admin-newsletters">
      <h1 className="font-heading text-2xl font-semibold md:text-3xl">
        Newsletters
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Compose and send to {subscriberCount.toLocaleString()} opted-in
        subscribers.
      </p>

      <AdminCard className="mt-8 space-y-4 p-6">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Subject
          </label>
          <input
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-foreground/30"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="This weekend in Bucharest"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            HTML content
          </label>
          <textarea
            className="min-h-[200px] w-full resize-y rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:ring-1 focus:ring-foreground/30"
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            placeholder="<p>Your newsletter content...</p>"
            required
          />
        </div>
        {feedback ? (
          <ActionFeedback message={feedback.message} type={feedback.type} />
        ) : null}
        <AdminButton
          size="md"
          disabled={pending || !subject || !htmlContent}
          onClick={() => setConfirmOpen(true)}
        >
          Send newsletter
        </AdminButton>
      </AdminCard>

      <ConfirmDialog
        open={confirmOpen}
        title="Send newsletter"
        description={`Send "${subject}" to ${subscriberCount.toLocaleString()} subscribers?`}
        confirmLabel="Send"
        confirmVariant="primary"
        onClose={() => setConfirmOpen(false)}
        pending={pending}
        onConfirm={handleSend}
      />

      <section className="mt-10">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Recent sends{isMockMode ? " (demo)" : ""}
        </h2>
        <ul className="space-y-3">
          {archive.map((item) => (
            <AdminCard key={item.id} className="p-4">
              <div className="font-medium">{item.subject}</div>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>Sent {item.sentAt}</span>
                <span>{item.recipients.toLocaleString()} recipients</span>
                <span>{item.opens.toLocaleString()} opens</span>
              </div>
            </AdminCard>
          ))}
        </ul>
      </section>
    </div>
  );
}
