"use client";

import { useRouter } from "@/i18n/navigation";
import { useState, useTransition } from "react";
import {
  approveBusinessAccount,
  reactivateBusinessAccount,
  rejectBusinessAccount,
  suspendUser,
  unsuspendUser,
} from "@/lib/actions/admin";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { ActionFeedback } from "@/components/admin/ui/action-feedback";
import { RejectDialog } from "@/components/admin/ui/reject-dialog";

type Props = {
  businessAccountId?: string;
  userId: string;
  status: string;
  isBusiness: boolean;
};

export function AdminUserActions({
  businessAccountId,
  userId,
  status,
  isBusiness,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);

  const run = (action: () => Promise<{ success: boolean; error?: string }>) => {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        setFeedback({ type: "success", message: "Updated" });
        router.refresh();
      } else {
        setFeedback({
          type: "error",
          message: result.error ?? "Action failed",
        });
      }
    });
  };

  if (!isBusiness) {
    return (
      <div className="space-y-1">
        <div className="flex flex-wrap gap-2">
          {status === "active" ? (
            <AdminButton
              size="sm"
              variant="danger"
              onClick={() => run(() => suspendUser(userId))}
              pending={pending}
              pendingLabel="Suspending…"
            >
              Suspend
            </AdminButton>
          ) : null}
          {status === "suspended" ? (
            <AdminButton
              size="sm"
              onClick={() => run(() => unsuspendUser(userId))}
              pending={pending}
              pendingLabel="Unsuspending…"
            >
              Unsuspend
            </AdminButton>
          ) : null}
        </div>
        {feedback ? (
          <ActionFeedback message={feedback.message} type={feedback.type} />
        ) : null}
      </div>
    );
  }

  if (!businessAccountId) {
    return (
      <span className="text-xs text-muted-foreground">—</span>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-2">
        {status === "pending" ? (
          <>
            <AdminButton
              size="sm"
              onClick={() => run(() => approveBusinessAccount(businessAccountId))}
              pending={pending}
              pendingLabel="Approving…"
            >
              Approve
            </AdminButton>
            <AdminButton
              size="sm"
              variant="secondary"
              onClick={() => setRejectOpen(true)}
              disabled={pending}
            >
              Reject
            </AdminButton>
          </>
        ) : null}
        {status === "approved" ? (
          <AdminButton
            size="sm"
            variant="danger"
            onClick={() => run(() => suspendUser(userId))}
            pending={pending}
            pendingLabel="Suspending…"
          >
            Suspend
          </AdminButton>
        ) : null}
        {status === "suspended" ? (
          <AdminButton
            size="sm"
            onClick={() =>
              run(() => reactivateBusinessAccount(businessAccountId))
            }
            pending={pending}
            pendingLabel="Reactivating…"
          >
            Reactivate
          </AdminButton>
        ) : null}
      </div>
      {feedback ? (
        <ActionFeedback message={feedback.message} type={feedback.type} />
      ) : null}

      <RejectDialog
        open={rejectOpen}
        title="Reject business account"
        onClose={() => setRejectOpen(false)}
        pending={pending}
        onConfirm={(reason) => {
          run(() => rejectBusinessAccount(businessAccountId, reason));
          setRejectOpen(false);
        }}
      />
    </div>
  );
}
