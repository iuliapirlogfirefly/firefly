"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { AuthField } from "@/components/auth/auth-field";
import { FireflyField } from "@/components/FireflyField";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PendingButton } from "@/components/ui/pending-button";
import { updatePassword } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Props = {
  authenticated: boolean;
};

export function ResetPasswordPage({ authenticated }: Props) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [ready, setReady] = useState(authenticated);
  const [hasSession, setHasSession] = useState(authenticated);

  useEffect(() => {
    if (authenticated || !isSupabaseConfigured()) {
      setHasSession(authenticated);
      setReady(true);
      return;
    }

    let cancelled = false;
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setHasSession(!!data.session);
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [authenticated]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("passwordsMismatch"));
      return;
    }

    startTransition(async () => {
      const result = await updatePassword(password);

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push("/auth");
      router.refresh();
    });
  };

  if (!ready) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-background">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-firefly/10 blur-3xl" />
        <FireflyField count={24} />
        <div className="absolute right-6 top-6 z-30">
          <LanguageSwitcher />
        </div>
        <section className="relative z-10 flex min-h-screen items-center justify-center px-6 py-24">
          <p className="text-sm text-foreground/60">{t("confirmingLink")}</p>
        </section>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-background">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-firefly/10 blur-3xl" />
        <FireflyField count={24} />
        <div className="absolute right-6 top-6 z-30">
          <LanguageSwitcher />
        </div>

        <section className="relative z-10 flex min-h-screen items-center justify-center px-6 py-24">
          <div className="w-full max-w-md">
            <div className="mb-10">
              <p className="mb-3 font-mono text-xs tracking-wider-2 text-firefly/80">
                {t("newLight")}
              </p>
              <h1 className="font-display text-5xl leading-[1.05] text-foreground text-glow sm:text-6xl">
                {t("chooseNew")}{" "}
                <span className="text-gradient-firefly">
                  {t("chooseNewAccent")}
                </span>
              </h1>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-destructive">{t("invalidExpiredLink")}</p>
              <Link
                href="/auth/forgot-password"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-firefly/30 px-6 py-3.5 text-sm font-medium text-firefly transition-all hover:bg-firefly/10"
              >
                {t("requestNewLink")}
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-firefly/10 blur-3xl" />
      <FireflyField count={24} />
      <div className="absolute right-6 top-6 z-30">
        <LanguageSwitcher />
      </div>

      <section className="relative z-10 flex min-h-screen items-center justify-center px-6 py-24">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <p className="mb-3 font-mono text-xs tracking-wider-2 text-firefly/80">
              {t("newLight")}
            </p>
            <h1 className="font-display text-5xl leading-[1.05] text-foreground text-glow sm:text-6xl">
              {t("chooseNew")}{" "}
              <span className="text-gradient-firefly">{t("chooseNewAccent")}</span>
            </h1>
            <p className="mt-4 text-pretty text-foreground/60">
              {t("guardFireflies")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthField icon={<Lock className="h-4 w-4" />} label={t("newPassword")}>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoFocus
                className="w-full bg-transparent text-foreground outline-none placeholder:text-foreground/30"
              />
              <button
                type="button"
                onClick={() => setShowPass((current) => !current)}
                className="text-foreground/40 transition-colors hover:text-firefly"
                aria-label={showPass ? t("hidePassword") : t("showPassword")}
              >
                {showPass ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </AuthField>

            <AuthField
              icon={<Lock className="h-4 w-4" />}
              label={t("confirmPassword")}
            >
              <input
                type={showPass ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-transparent text-foreground outline-none placeholder:text-foreground/30"
              />
            </AuthField>

            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}

            <PendingButton
              type="submit"
              pending={pending}
              pendingLabel={t("updating")}
              className="group mt-2 w-full rounded-full bg-firefly px-6 py-3.5 text-sm font-medium text-primary-foreground transition-all hover:scale-[1.01] hover:firefly-glow"
            >
              {t("updatePassword")}
              {!pending ? (
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              ) : null}
            </PendingButton>
          </form>
        </div>
      </section>
    </div>
  );
}
