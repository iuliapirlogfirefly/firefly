"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { updateBusinessBilling } from "@/lib/actions/business";
import type { BusinessBillingInfo } from "@/types";

type Props = {
  businessAccountId: string;
  businessName: string;
  initialBilling: BusinessBillingInfo;
};

export function BusinessSettingsPage({
  businessAccountId,
  businessName,
  initialBilling,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [billing, setBilling] = useState(initialBilling);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const setField = (key: keyof BusinessBillingInfo, value: string) => {
    setBilling((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const result = await updateBusinessBilling(businessAccountId, billing);
      if (result.success) {
        setFeedback({ type: "success", message: "Billing details saved." });
        router.refresh();
      } else {
        setFeedback({ type: "error", message: result.error });
      }
    });
  };

  return (
    <div data-route="business-settings">
      <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
        ◦ Business · Settings
      </div>
      <h1 className="font-heading text-4xl font-bold">
        Billing <span className="text-gradient-firefly">details</span>
      </h1>
      <p className="mt-3 text-foreground/60">
        Fiscal information for {businessName}. Used for invoices and admin
        records.
      </p>

      <form onSubmit={handleSubmit} className="glass mt-8 max-w-xl space-y-4 rounded-2xl p-6">
        {(
          [
            ["legalName", "Legal company name"],
            ["cui", "CUI"],
            ["billingAddress", "Billing address"],
            ["billingCity", "City"],
            ["billingCounty", "County"],
            ["billingPostalCode", "Postal code"],
            ["billingCountry", "Country (ISO)"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block">
            <span className="font-mono text-[10px] uppercase tracking-wider-2 text-foreground/40">
              {label}
            </span>
            <input
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-firefly/40"
              value={billing[key]}
              onChange={(e) => setField(key, e.target.value)}
              required
            />
          </label>
        ))}

        {feedback ? (
          <p
            className={`text-sm ${
              feedback.type === "success" ? "text-firefly" : "text-destructive"
            }`}
          >
            {feedback.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-firefly px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save billing details"}
        </button>
      </form>
    </div>
  );
}
