"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { publishFeedPost, rejectFeedPost } from "@/lib/actions/admin";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { ActionFeedback } from "@/components/admin/ui/action-feedback";
import { RejectDialog } from "@/components/admin/ui/reject-dialog";

type Props = {
  postId: string;
  status?: string;
};

export function AdminPostActions({ postId, status = "pending" }: Props) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
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
        setFeedback({ type: "success", message: t("publishedFeedback") });
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
        {status === "pending" ? (
          <>
            <AdminButton
              onClick={() => run(() => publishFeedPost(postId))}
              pending={pending}
              pendingLabel={t("publishing")}
            >
              {t("publish")}
            </AdminButton>
            <AdminButton
              variant="secondary"
              onClick={() => setRejectOpen(true)}
              disabled={pending}
            >
              {t("reject")}
            </AdminButton>
          </>
        ) : null}
      </div>
      {feedback ? (
        <ActionFeedback message={feedback.message} type={feedback.type} />
      ) : null}

      <RejectDialog
        open={rejectOpen}
        title={t("rejectPost")}
        onClose={() => setRejectOpen(false)}
        pending={pending}
        onConfirm={(reason) => {
          startTransition(async () => {
            const result = await rejectFeedPost(postId, reason);
            setRejectOpen(false);
            if (result.success) {
              setFeedback({ type: "success", message: t("rejectedFeedback") });
              router.refresh();
            } else {
              setFeedback({
                type: "error",
                message: result.error ?? tCommon("actionFailed"),
              });
            }
          });
        }}
      />
    </div>
  );
}
