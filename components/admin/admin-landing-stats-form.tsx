"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { updateLandingStatsSettings } from "@/lib/actions/site-settings";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { ActionFeedback } from "@/components/admin/ui/action-feedback";

type Props = {
  initialEnabled: boolean;
};

export function AdminLandingStatsForm({ initialEnabled }: Props) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const result = await updateLandingStatsSettings({ enabled });
      if (result.success) {
        setFeedback({ type: "success", message: t("landingStatsSaved") });
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
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
          />
          <span>
            <span className="block text-sm font-medium text-foreground">
              {t("landingStatsEnabled")}
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {t("landingStatsHint")}
            </span>
          </span>
        </label>

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
