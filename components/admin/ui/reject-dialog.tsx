"use client";

import { useEffect, useRef, useState } from "react";
import { AdminButton } from "./admin-button";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  pending?: boolean;
};

export function RejectDialog({
  open,
  title,
  onClose,
  onConfirm,
  pending = false,
}: Props) {
  const [reason, setReason] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      setReason("");
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 10) return;
    onConfirm(reason.trim());
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 z-50 m-auto w-full max-w-md rounded-xl border border-border bg-surface-1 p-0 text-foreground backdrop:bg-black/60"
    >
      <form onSubmit={handleSubmit} className="p-6">
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Provide a short reason (min. 10 characters). This may be shared with the
          submitter.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          className="mt-4 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-foreground/30"
          placeholder="Reason for rejection..."
          required
          minLength={10}
        />
        <div className="mt-6 flex justify-end gap-2">
          <AdminButton
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </AdminButton>
          <AdminButton
            type="submit"
            variant="danger"
            disabled={pending || reason.trim().length < 10}
          >
            {pending ? "Rejecting..." : "Reject"}
          </AdminButton>
        </div>
      </form>
    </dialog>
  );
}
