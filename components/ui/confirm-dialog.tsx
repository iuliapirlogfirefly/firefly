"use client";

import { useEffect, useRef } from "react";
import { PendingButton } from "@/components/ui/pending-button";

type Props = {
  open: boolean;
  title: string;
  description: string;
  extraDescription?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  pendingLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
  pending?: boolean;
  error?: string | null;
};

export function ConfirmDialog({
  open,
  title,
  description,
  extraDescription,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  pendingLabel = "Processing…",
  onClose,
  onConfirm,
  pending = false,
  error = null,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 z-50 m-auto w-full max-w-md rounded-2xl border border-firefly/20 bg-surface-1 p-0 text-foreground backdrop:bg-black/60"
    >
      <div className="p-6">
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-foreground/70">{description}</p>
        {extraDescription ? (
          <p className="mt-2 text-sm text-foreground/70">{extraDescription}</p>
        ) : null}
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-full px-4 py-2 text-sm text-foreground/60 hover:text-foreground disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <PendingButton
            type="button"
            pending={pending}
            pendingLabel={pendingLabel}
            onClick={onConfirm}
            className="rounded-full border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
          >
            {confirmLabel}
          </PendingButton>
        </div>
      </div>
    </dialog>
  );
}
