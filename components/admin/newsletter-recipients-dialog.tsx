"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AdminButton } from "@/components/admin/ui/admin-button";
import type { NewsletterSubscriber } from "@/lib/queries/users";

type Props = {
  open: boolean;
  subscribers: NewsletterSubscriber[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onClose: () => void;
};

export function NewsletterRecipientsDialog({
  open,
  subscribers,
  selectedIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
  onClose,
}: Props) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const query = search.trim().toLowerCase();
  const visible = query
    ? subscribers.filter((subscriber) =>
        `${subscriber.name} ${subscriber.email}`.toLowerCase().includes(query)
      )
    : subscribers;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 z-50 m-auto w-full max-w-lg rounded-xl border border-border bg-surface-1 p-0 text-foreground backdrop:bg-black/60"
    >
      <div className="p-6">
        <h2 className="font-heading text-lg font-semibold">{t("sendToTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("sendToHint")}</p>

        <input
          className="mt-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-foreground/30"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("searchRecipients")}
          aria-label={t("searchRecipients")}
        />

        <div className="mt-3 flex gap-2">
          <AdminButton variant="secondary" onClick={onSelectAll}>
            {t("selectAll")}
          </AdminButton>
          <AdminButton variant="ghost" onClick={onDeselectAll}>
            {t("deselectAll")}
          </AdminButton>
        </div>

        <ul className="mt-4 max-h-[50vh] space-y-1 overflow-y-auto">
          {subscribers.length === 0 ? (
            <li className="px-1 py-3 text-sm text-muted-foreground">
              {t("noSubscribers")}
            </li>
          ) : visible.length === 0 ? (
            <li className="px-1 py-3 text-sm text-muted-foreground">
              {t("noRecipientsMatch")}
            </li>
          ) : (
            visible.map((subscriber) => (
              <li key={subscriber.id}>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-surface-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(subscriber.id)}
                    onChange={() => onToggle(subscriber.id)}
                    className="mt-0.5 h-4 w-4 rounded border-border accent-firefly"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm">{subscriber.name}</span>
                    {subscriber.name !== subscriber.email ? (
                      <span className="block truncate text-xs text-muted-foreground">
                        {subscriber.email}
                      </span>
                    ) : null}
                  </span>
                </label>
              </li>
            ))
          )}
        </ul>

        {selectedIds.size === 0 ? (
          <p className="mt-3 text-xs text-destructive">{t("errorNoRecipients")}</p>
        ) : null}

        <div className="mt-6 flex justify-end">
          <AdminButton variant="secondary" onClick={onClose}>
            {tCommon("close")}
          </AdminButton>
        </div>
      </div>
    </dialog>
  );
}
