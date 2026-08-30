"use client";

import { useRouter } from "@/i18n/navigation";
import { useState, useTransition } from "react";
import {
  markPromotionDelivered,
  unmarkPromotionDelivered,
  updatePromotionDelivery,
} from "@/lib/actions/admin";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { ActionFeedback } from "@/components/admin/ui/action-feedback";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { DeliveryDialog } from "@/components/admin/ui/delivery-dialog";

type Props = {
  promotionId: string;
  fulfilled: boolean;
  deliveryUrl: string | null;
  deliveryNotes: string | null;
};

export function AdminDeliveryActions({
  promotionId,
  fulfilled,
  deliveryUrl,
  deliveryNotes,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [unmarkOpen, setUnmarkOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const run = (
    action: () => Promise<{ success: boolean; error?: string }>,
    successMessage: string,
    onSuccess?: () => void
  ) => {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        setFeedback({ type: "success", message: successMessage });
        onSuccess?.();
        router.refresh();
      } else {
        setFeedback({
          type: "error",
          message: result.error ?? "Action failed",
        });
      }
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {fulfilled ? (
          <>
            <AdminButton
              variant="secondary"
              onClick={() => setDialogOpen(true)}
              pending={pending}
              pendingLabel="Saving…"
            >
              Edit details
            </AdminButton>
            <AdminButton
              variant="danger"
              onClick={() => setUnmarkOpen(true)}
              pending={pending}
              pendingLabel="Unmarking…"
            >
              Unmark
            </AdminButton>
          </>
        ) : (
          <AdminButton
            onClick={() => setDialogOpen(true)}
            pending={pending}
            pendingLabel="Saving…"
          >
            Mark delivered
          </AdminButton>
        )}
      </div>

      {feedback ? (
        <ActionFeedback message={feedback.message} type={feedback.type} />
      ) : null}

      <DeliveryDialog
        open={dialogOpen}
        title={fulfilled ? "Edit delivery details" : "Mark as delivered"}
        confirmLabel={fulfilled ? "Save" : "Mark delivered"}
        initialUrl={deliveryUrl}
        initialNotes={deliveryNotes}
        pending={pending}
        onClose={() => setDialogOpen(false)}
        onConfirm={({ url, notes }) => {
          if (fulfilled) {
            run(
              () => updatePromotionDelivery(promotionId, { url, notes }),
              "Delivery details updated",
              () => setDialogOpen(false)
            );
          } else {
            run(
              () => markPromotionDelivered(promotionId, { url, notes }),
              "Marked as delivered",
              () => setDialogOpen(false)
            );
          }
        }}
      />

      <ConfirmDialog
        open={unmarkOpen}
        title="Unmark delivery?"
        description="This will clear the delivered status, URL, and notes so the item appears pending again."
        confirmLabel="Unmark"
        confirmVariant="danger"
        pending={pending}
        onClose={() => setUnmarkOpen(false)}
        onConfirm={() => {
          run(
            () => unmarkPromotionDelivered(promotionId),
            "Unmarked",
            () => setUnmarkOpen(false)
          );
        }}
      />
    </div>
  );
}
