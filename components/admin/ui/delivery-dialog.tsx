"use client";

import { useEffect, useRef, useState } from "react";
import { AdminButton } from "@/components/admin/ui/admin-button";

type Props = {
  open: boolean;
  title: string;
  confirmLabel: string;
  initialUrl?: string | null;
  initialNotes?: string | null;
  onClose: () => void;
  onConfirm: (data: { url: string; notes: string }) => void;
  pending?: boolean;
};

export function DeliveryDialog({
  open,
  title,
  confirmLabel,
  initialUrl = "",
  initialNotes = "",
  onClose,
  onConfirm,
  pending = false,
}: Props) {
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      setUrl(initialUrl ?? "");
      setNotes(initialNotes ?? "");
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, initialUrl, initialNotes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({ url: url.trim(), notes: notes.trim() });
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
          Optionally add the post or newsletter link and any notes for the team.
        </p>
        <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Delivery URL
          <input
            type="text"
            inputMode="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-foreground/30"
          />
        </label>
        <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Notes
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Posted to Instagram feed…"
            className="mt-1.5 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-foreground/30"
          />
        </label>
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
            pending={pending}
            pendingLabel="Saving…"
          >
            {confirmLabel}
          </AdminButton>
        </div>
      </form>
    </dialog>
  );
}
