"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  createConsent,
  getStoredConsent,
  writeConsent,
} from "@/lib/legal/cookie-consent";

export function CookieConsentBanner() {
  const t = useTranslations("cookiesBanner");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getStoredConsent()) {
      setVisible(true);
    }

    const open = () => setVisible(true);
    window.addEventListener("ff:cookie-consent-open", open);
    return () => window.removeEventListener("ff:cookie-consent-open", open);
  }, []);

  function acknowledge() {
    writeConsent(createConsent({ analytics: false, marketing: false }));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-[60] px-3 md:bottom-4 md:px-4"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-4 border border-firefly/15 bg-surface-1/95 p-5 shadow-lg backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between md:p-6">
        <div className="min-w-0 flex-1">
          <h2
            id="cookie-consent-title"
            className="font-heading text-base font-semibold text-foreground"
          >
            {t("title")}
          </h2>
          <p
            id="cookie-consent-desc"
            className="mt-1.5 text-sm leading-relaxed text-foreground/65"
          >
            {t("description")}{" "}
            <Link
              href="/cookies"
              className="underline underline-offset-2 hover:text-firefly"
            >
              {t("cookiesLink")}
            </Link>
          </p>
        </div>
        <button
          type="button"
          onClick={acknowledge}
          className="shrink-0 rounded-full bg-firefly px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
        >
          {t("acknowledge")}
        </button>
      </div>
    </div>
  );
}
