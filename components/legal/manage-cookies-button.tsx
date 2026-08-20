"use client";

import { requestConsentPreferences } from "@/lib/legal/cookie-consent";

type Props = {
  label: string;
  className?: string;
};

export function ManageCookiesButton({ label, className }: Props) {
  return (
    <button
      type="button"
      onClick={() => requestConsentPreferences()}
      className={
        className ??
        "transition-colors hover:text-firefly text-left cursor-pointer"
      }
    >
      {label}
    </button>
  );
}
