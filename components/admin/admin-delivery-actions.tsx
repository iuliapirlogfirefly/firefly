"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
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
          message: result.error ?? tCommon("actionFailed"),
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
              pendingLabel={tCommon("saving")}
            >
              {t("editDetails")}
            </AdminButton>
            <AdminButton
              variant="danger"
              onClick={() => setUnmarkOpen(true)}
              pending={pending}
              pendingLabel={t("unmarking")}
            >
              {t("unmark")}
            </AdminButton>
          </>
        ) : (
          <AdminButton
            onClick={() => setDialogOpen(true)}
            pending={pending}
            pendingLabel={tCommon("saving")}
          >
            {t("markDelivered")}
          </AdminButton>
        )}
      </div>

      {feedback ? (
        <ActionFeedback message={feedback.message} type={feedback.type} />
      ) : null}

      <DeliveryDialog
        open={dialogOpen}
        title={fulfilled ? t("editDelivery") : t("markAsDelivered")}
        confirmLabel={fulfilled ? tCommon("save") : t("markDelivered")}
        initialUrl={deliveryUrl}
        initialNotes={deliveryNotes}
        pending={pending}
        onClose={() => setDialogOpen(false)}
        onConfirm={({ url, notes }) => {
          if (fulfilled) {
            run(
              () => updatePromotionDelivery(promotionId, { url, notes }),
              t("detailsUpdated"),
              () => setDialogOpen(false)
            );
          } else {
            run(
              () => markPromotionDelivered(promotionId, { url, notes }),
              t("markedDelivered"),
              () => setDialogOpen(false)
            );
          }
        }}
      />

      <ConfirmDialog
        open={unmarkOpen}
        title={t("unmarkTitle")}
        description={t("unmarkDescription")}
        confirmLabel={t("unmark")}
        confirmVariant="danger"
        pending={pending}
        onClose={() => setUnmarkOpen(false)}
        onConfirm={() => {
          run(
            () => unmarkPromotionDelivered(promotionId),
            t("unmarked"),
            () => setUnmarkOpen(false)
          );
        }}
      />
    </div>
  );
}
