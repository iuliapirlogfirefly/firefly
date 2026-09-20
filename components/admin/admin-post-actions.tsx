"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import {
  deleteFeedPost,
  publishFeedPost,
  rejectFeedPost,
  unpublishFeedPost,
} from "@/lib/actions/admin";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { ActionFeedback } from "@/components/admin/ui/action-feedback";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { RejectDialog } from "@/components/admin/ui/reject-dialog";

type Props = {
  postId: string;
  status?: string;
  compact?: boolean;
};

export function AdminPostActions({
  postId,
  status = "pending",
  compact = false,
}: Props) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

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

  const editLink = (
    <Link
      href={`/admin/posts/${postId}/edit`}
      className="text-sm text-foreground underline-offset-2 hover:underline"
    >
      {tCommon("edit")}
    </Link>
  );

  return (
    <div className="space-y-2">
      <div className={`flex flex-wrap gap-2 ${compact ? "items-center" : ""}`}>
        {status === "pending" || status === "draft" ? (
          <AdminButton
            size={compact ? "sm" : "md"}
            onClick={() =>
              run(() => publishFeedPost(postId), t("publishedFeedback"))
            }
            pending={pending}
            pendingLabel={t("publishing")}
          >
            {t("publish")}
          </AdminButton>
        ) : null}
        {status === "pending" ? (
          <AdminButton
            size={compact ? "sm" : "md"}
            variant="secondary"
            onClick={() => setRejectOpen(true)}
            disabled={pending}
          >
            {t("reject")}
          </AdminButton>
        ) : null}
        {status === "published" ? (
          <AdminButton
            size={compact ? "sm" : "md"}
            variant="secondary"
            onClick={() => setUnpublishOpen(true)}
            disabled={pending}
          >
            {t("unpublish")}
          </AdminButton>
        ) : null}
        {editLink}
        <AdminButton
          size={compact ? "sm" : "md"}
          variant="danger"
          onClick={() => setDeleteOpen(true)}
          disabled={pending}
        >
          {tCommon("delete")}
        </AdminButton>
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

      <ConfirmDialog
        open={unpublishOpen}
        title={t("unpublishPost")}
        description={t("unpublishDescription")}
        confirmLabel={t("unpublish")}
        confirmVariant="primary"
        onClose={() => setUnpublishOpen(false)}
        pending={pending}
        onConfirm={() => {
          run(() => unpublishFeedPost(postId), t("unpublishedFeedback"));
          setUnpublishOpen(false);
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={t("deletePost")}
        description={t("deletePostDescription")}
        confirmLabel={tCommon("delete")}
        onClose={() => setDeleteOpen(false)}
        pending={pending}
        onConfirm={() => {
          run(
            () => deleteFeedPost(postId),
            t("deletedFeedback"),
            () => router.push("/admin/posts")
          );
          setDeleteOpen(false);
        }}
      />
    </div>
  );
}
