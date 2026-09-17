"use client";

import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language-switcher";

export function LanguageSettings() {
  const t = useTranslations("profile");

  return (
    <div className="mt-6 glass rounded-3xl p-6">
      <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
        {t("languageEyebrow")}
      </div>
      <h2 className="font-heading text-2xl font-semibold">{t("languageTitle")}</h2>
      <p className="mt-2 max-w-lg text-sm text-foreground/60">
        {t("languageDescription")}
      </p>
      <div className="mt-6">
        <LanguageSwitcher />
      </div>
    </div>
  );
}
