"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteBusinessEvent } from "@/lib/actions/events";
import { deleteBusinessFeedPost } from "@/lib/actions/business";

type Props = {
  kind: "event" | "post";
  id: string;
  isLive: boolean;
};

export function BusinessDeleteButton({ kind, id, isLive }: Props) {
  const t = useTranslations("business");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (pending) return;
    setOpen(false);
    setError(null);
  };

  const onConfirm = async () => {
    setPending(true);
    setError(null);

    const result =
      kind === "event"
        ? await deleteBusinessEvent(id)
        : await deleteBusinessFeedPost(id);

    if (!result.success) {
      setPending(false);
      setError(result.error);
      return;
    }

    setPending(false);
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-destructive/30 px-3 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/10"
      >
        {t("delete")}
      </button>
      <ConfirmDialog
        open={open}
        title={kind === "event" ? t("deleteEventTitle") : t("deletePostTitle")}
        description={t("deleteWarning")}
        extraDescription={isLive ? t("deleteLiveWarning") : undefined}
        confirmLabel={t("deleteConfirm")}
        cancelLabel={t("deleteCancel")}
        pendingLabel={t("deleting")}
        pending={pending}
        error={error}
        onClose={close}
        onConfirm={() => void onConfirm()}
      />
    </>
  );
}
