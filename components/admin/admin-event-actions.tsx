"use client";

import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { useState, useTransition } from "react";
import {
  approveEvent,
  archiveEvent,
  deleteEvent,
  rejectEvent,
  restoreEvent,
} from "@/lib/actions/events";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { ActionFeedback } from "@/components/admin/ui/action-feedback";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { RejectDialog } from "@/components/admin/ui/reject-dialog";

type Props = {
  eventId: string;
  status: string;
  compact?: boolean;
};

export function AdminEventActions({ eventId, status, compact = false }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const run = (action: () => Promise<{ success: boolean; error?: string }>) => {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        setFeedback({ type: "success", message: "Done" });
        router.refresh();
      } else {
        setFeedback({
          type: "error",
          message: result.error ?? "Action failed",
        });
      }
    });
  };

  const editLink = (
    <Link
      href={`/admin/events/${eventId}/edit`}
      className="text-sm text-foreground underline-offset-2 hover:underline"
    >
      Edit
    </Link>
  );

  return (
    <div className="space-y-2">
      <div className={`flex flex-wrap gap-2 ${compact ? "items-center" : ""}`}>
        {status === "pending" ? (
          <>
            <AdminButton
              size={compact ? "sm" : "md"}
              onClick={() => run(() => approveEvent(eventId))}
              disabled={pending}
            >
              Approve
            </AdminButton>
            <AdminButton
              size={compact ? "sm" : "md"}
              variant="secondary"
              onClick={() => setRejectOpen(true)}
              disabled={pending}
            >
              Reject
            </AdminButton>
          </>
        ) : null}
        {status === "published" ? (
          <>
            <AdminButton
              size={compact ? "sm" : "md"}
              variant="secondary"
              onClick={() => setArchiveOpen(true)}
              disabled={pending}
            >
              Archive
            </AdminButton>
            {editLink}
          </>
        ) : null}
        {status === "archived" ? (
          <>
            <AdminButton
              size={compact ? "sm" : "md"}
              onClick={() => run(() => restoreEvent(eventId))}
              disabled={pending}
            >
              Restore
            </AdminButton>
            {editLink}
          </>
        ) : null}
        {status !== "pending" && status !== "published" && status !== "archived"
          ? editLink
          : null}
        <AdminButton
          size={compact ? "sm" : "md"}
          variant="danger"
          onClick={() => setDeleteOpen(true)}
          disabled={pending}
        >
          Delete
        </AdminButton>
      </div>
      {feedback ? (
        <ActionFeedback message={feedback.message} type={feedback.type} />
      ) : null}

      <RejectDialog
        open={rejectOpen}
        title="Reject event"
        onClose={() => setRejectOpen(false)}
        pending={pending}
        onConfirm={(reason) => {
          run(() => rejectEvent(eventId, reason));
          setRejectOpen(false);
        }}
      />

      <ConfirmDialog
        open={archiveOpen}
        title="Archive event"
        description="This removes the event from public view without deleting it."
        confirmLabel="Archive"
        onClose={() => setArchiveOpen(false)}
        pending={pending}
        onConfirm={() => {
          run(() => archiveEvent(eventId));
          setArchiveOpen(false);
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete event"
        description="This permanently removes the event. This cannot be undone."
        confirmLabel="Delete"
        onClose={() => setDeleteOpen(false)}
        pending={pending}
        onConfirm={() => {
          run(() => deleteEvent(eventId));
          setDeleteOpen(false);
        }}
      />
    </div>
  );
}
