"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { updateProfile } from "@/lib/actions/auth";

type Props = {
  initialOptIn: boolean;
};

export function NewsletterSettings({ initialOptIn }: Props) {
  const t = useTranslations("newsletter");
  const [optIn, setOptIn] = useState(initialOptIn);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = (next: boolean) => {
    setError(null);
    setMessage(null);
    setOptIn(next);

    startTransition(async () => {
      const result = await updateProfile({ newsletterOptIn: next });

      if (!result.success) {
        setOptIn(!next);
        setError(result.error);
        return;
      }

      setMessage(next ? t("subscribedMessage") : t("unsubscribedMessage"));
    });
  };

  return (
    <div className="mt-6 glass rounded-3xl p-6">
      <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
        ◦ {t("sectionLabel")}
      </div>
      <h2 className="font-heading text-2xl font-semibold">{t("title")}</h2>
      <p className="mt-2 max-w-lg text-sm text-foreground/60">{t("description")}</p>

      <label className="mt-6 flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={optIn}
          disabled={pending}
          onChange={(e) => handleToggle(e.target.checked)}
          className="h-4 w-4 rounded border-firefly/30 accent-firefly disabled:opacity-50"
        />
        <span className="text-sm">{t("optInLabel")}</span>
      </label>

      {message ? (
        <p className="mt-3 text-sm text-firefly" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
