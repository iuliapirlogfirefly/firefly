"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AdminButton } from "@/components/admin/ui/admin-button";
import type {
  NewsletterAudience,
  NewsletterSubscriber,
} from "@/lib/queries/users";

type Props = {
  open: boolean;
  subscribers: NewsletterSubscriber[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSetAudience: (audience: NewsletterAudience, selected: boolean) => void;
  onClose: () => void;
};

const AUDIENCES: NewsletterAudience[] = ["business", "user"];

function GroupCheckbox({
  checked,
  indeterminate,
  onChange,
  label,
  countLabel,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  label: string;
  countLabel: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label className="flex cursor-pointer items-center gap-3 px-2 py-2">
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-border accent-firefly"
      />
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">{countLabel}</span>
    </label>
  );
}

export function NewsletterRecipientsDialog({
  open,
  subscribers,
  selectedIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
  onSetAudience,
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
  const matches = (subscriber: NewsletterSubscriber) =>
    !query ||
    `${subscriber.name} ${subscriber.email}`.toLowerCase().includes(query);

  const groups = AUDIENCES.map((audience) => {
    const members = subscribers.filter(
      (subscriber) => subscriber.audience === audience
    );
    return {
      audience,
      members,
      visible: members.filter(matches),
    };
  }).filter((group) => group.visible.length > 0);

  const labels: Record<NewsletterAudience, string> = {
    business: t("businesses"),
    user: t("users"),
  };

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

        <div className="mt-4 max-h-[50vh] space-y-4 overflow-y-auto">
          {subscribers.length === 0 ? (
            <p className="px-1 py-3 text-sm text-muted-foreground">
              {t("noSubscribers")}
            </p>
          ) : groups.length === 0 ? (
            <p className="px-1 py-3 text-sm text-muted-foreground">
              {t("noRecipientsMatch")}
            </p>
          ) : (
            groups.map((group) => {
              const selectedCount = group.members.filter((subscriber) =>
                selectedIds.has(subscriber.id)
              ).length;
              const allSelected =
                group.members.length > 0 && selectedCount === group.members.length;

              return (
                <section key={group.audience}>
                  <GroupCheckbox
                    checked={allSelected}
                    indeterminate={selectedCount > 0 && !allSelected}
                    onChange={() => onSetAudience(group.audience, !allSelected)}
                    label={labels[group.audience]}
                    countLabel={`${selectedCount}/${group.members.length}`}
                  />
                  <ul className="space-y-1">
                    {group.visible.map((subscriber) => (
                      <li key={subscriber.id}>
                        <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 pl-9 hover:bg-surface-2">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(subscriber.id)}
                            onChange={() => onToggle(subscriber.id)}
                            className="mt-0.5 h-4 w-4 rounded border-border accent-firefly"
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-sm">
                              {subscriber.name}
                            </span>
                            {subscriber.name !== subscriber.email ? (
                              <span className="block truncate text-xs text-muted-foreground">
                                {subscriber.email}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })
          )}
        </div>

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
