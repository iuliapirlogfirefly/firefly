"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "@/components/session-provider";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { updateProfile } from "@/lib/actions/auth";

type Props = {
  className?: string;
};

export function LanguageSwitcher({ className = "" }: Props) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const t = useTranslations("nav");
  const [pending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale || pending) return;

    startTransition(async () => {
      if (session.userId) {
        await updateProfile({ preferredLocale: next });
      }
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div
      role="group"
      aria-label={t("languageSwitcher")}
      className={`inline-flex items-center gap-0.5 rounded-full border border-foreground/20 px-1 py-0.5 ${className}`}
    >
      {routing.locales.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            disabled={pending}
            onClick={() => switchTo(code)}
            aria-pressed={active}
            className={`rounded-full px-2 py-1 font-mono text-[10px] uppercase tracking-wider-2 transition-colors disabled:opacity-50 ${
              active
                ? "bg-firefly/15 text-firefly"
                : "text-foreground/50 hover:text-foreground/80"
            }`}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
