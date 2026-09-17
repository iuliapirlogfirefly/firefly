"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { updatePrelaunchSettings } from "@/lib/actions/site-settings";
import { isPrelaunchActiveFromSettings } from "@/lib/launch/config";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { ActionFeedback } from "@/components/admin/ui/action-feedback";

type Props = {
  initialActive: boolean;
  initialEndsAt: string | null;
};

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function AdminLaunchSettingsForm({
  initialActive,
  initialEndsAt,
}: Props) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [active, setActive] = useState(initialActive);
  const [endsAt, setEndsAt] = useState(toDatetimeLocal(initialEndsAt));
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const previewLive = !isPrelaunchActiveFromSettings({
    active,
    endsAt: endsAt ? new Date(endsAt) : null,
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const result = await updatePrelaunchSettings({
        active,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      });
      if (result.success) {
        setFeedback({ type: "success", message: t("launchSaved") });
        router.refresh();
      } else {
        setFeedback({ type: "error", message: result.error });
      }
    });
  };

  return (
    <AdminCard className="max-w-xl p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-border accent-firefly"
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
          />
          <span>
            <span className="block text-sm font-medium text-foreground">
              {t("countdownActive")}
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {t("countdownHint")}
            </span>
          </span>
        </label>

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("endDate")}
          </span>
          <input
            type="datetime-local"
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-firefly/40"
            value={endsAt}
            onChange={(event) => setEndsAt(event.target.value)}
            required={active}
          />
          <span className="mt-1.5 block text-xs text-muted-foreground">
            {t("endDateHint")}
          </span>
        </label>

        <p
          className={`text-sm font-medium ${
            previewLive ? "text-emerald-400" : "text-amber-400"
          }`}
        >
          {previewLive ? t("previewLive") : t("previewCountdown")}
        </p>

        {feedback ? (
          <ActionFeedback message={feedback.message} type={feedback.type} />
        ) : null}

        <AdminButton type="submit" variant="primary" size="md" pending={pending}>
          {t("saveSettings")}
        </AdminButton>
      </form>
    </AdminCard>
  );
}
