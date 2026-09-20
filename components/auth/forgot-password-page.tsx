"use client";

import { useState, useTransition, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AuthField } from "@/components/auth/auth-field";
import { FireflyField } from "@/components/FireflyField";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PendingButton } from "@/components/ui/pending-button";
import { requestPasswordReset } from "@/lib/actions/auth";
import type { Locale } from "@/types";

type Props = {
  locale: Locale;
  linkError?: boolean;
};

export function ForgotPasswordPage({ locale, linkError }: Props) {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await requestPasswordReset(email, locale);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSent(true);
    });
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-firefly/10 blur-3xl" />
      <FireflyField count={24} />

      <Link
        href="/auth"
        className="absolute left-6 top-6 z-30 inline-flex items-center gap-2 text-sm text-foreground/60 transition-colors hover:text-firefly"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToSignIn")}
      </Link>
      <div className="absolute right-6 top-6 z-30">
        <LanguageSwitcher />
      </div>

      <section className="relative z-10 flex min-h-screen items-center justify-center px-6 py-24">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <p className="mb-3 font-mono text-xs tracking-wider-2 text-firefly/80">
              {t("lostInDark")}
            </p>
            <h1 className="font-heading text-5xl font-bold leading-[0.95] tracking-tight-logo text-foreground sm:text-6xl">
              {t("resetPasswordTitle")}{" "}
              <span className="bg-gradient-to-r from-white to-firefly bg-clip-text text-transparent text-glow italic">
                {t("resetPasswordAccent")}
              </span>
            </h1>
            <p className="mt-4 text-pretty text-foreground/60">
              {sent ? t("resetSent") : t("resetPrompt")}
            </p>
          </div>

          {linkError ? (
            <p className="mb-4 text-sm text-destructive">
              {t("resetLinkInvalid")}
            </p>
          ) : null}

          {sent ? (
            <div className="space-y-4">
              <p className="text-sm text-foreground/50">{t("didntGetIt")}</p>
              <Link
                href="/auth"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-firefly/30 px-6 py-3.5 text-sm font-medium text-firefly transition-all hover:bg-firefly/10"
              >
                {t("backToSignIn")}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <AuthField icon={<Mail className="h-4 w-4" />} label={t("email")}>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t("emailPlaceholder")}
                  required
                  autoFocus
                  className="w-full bg-transparent text-foreground outline-none placeholder:text-foreground/30"
                />
              </AuthField>

              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}

              <PendingButton
                type="submit"
                pending={pending}
                pendingLabel={t("sending")}
                className="group mt-2 w-full rounded-full bg-firefly px-6 py-3.5 text-sm font-medium text-primary-foreground transition-all hover:scale-[1.01] hover:firefly-glow"
              >
                {t("sendResetLink")}
                {!pending ? (
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                ) : null}
              </PendingButton>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
