"use client";

import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Link } from "@/i18n/navigation";
import { ExternalLink } from "lucide-react";

export function AdminHeader() {
  const t = useTranslations("admin");

  return (
    <header className="flex h-14 shrink-0 items-center justify-end gap-3 border-b border-border bg-background px-4 lg:px-8">
      <LanguageSwitcher />
      <Link
        href="/"
        className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {t("backToSite")}
        <ExternalLink className="h-3.5 w-3.5" />
      </Link>
    </header>
  );
}
