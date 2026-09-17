"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  setPromotionInvoiced,
  setSubscriptionInvoiced,
} from "@/lib/actions/admin";
import { ActionFeedback } from "@/components/admin/ui/action-feedback";

type Props = {
  kind: "promotion" | "subscription";
  id: string;
  invoiced: boolean;
  label?: string;
};

export function AdminInvoicedCheckbox({
  kind,
  id,
  invoiced,
  label,
}: Props) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [checked, setChecked] = useState(invoiced);
  const [error, setError] = useState<string | null>(null);
  const ariaLabel = label ?? t("colInvoiced");

  useEffect(() => {
    setChecked(invoiced);
  }, [invoiced]);

  const onChange = (next: boolean) => {
    setChecked(next);
    setError(null);
    startTransition(async () => {
      const action =
        kind === "promotion" ? setPromotionInvoiced : setSubscriptionInvoiced;
      const result = await action(id, next);
      if (result.success) {
        router.refresh();
      } else {
        setChecked(invoiced);
        setError(result.error ?? tCommon("actionFailed"));
      }
    });
  };

  return (
    <div className="space-y-1">
      <label className="inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          checked={checked}
          disabled={pending}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4 rounded border-border accent-firefly disabled:opacity-50"
          aria-label={ariaLabel}
        />
      </label>
      {error ? <ActionFeedback message={error} type="error" /> : null}
    </div>
  );
}
