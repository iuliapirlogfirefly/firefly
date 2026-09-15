"use client";

import { useState, useTransition, type FormEvent } from "react";
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { usePrelaunch } from "@/components/launch-provider";
import {
  AccountTypeSwitch,
  BusinessTypeSwitch,
} from "@/components/auth/account-type-switch";
import { AuthField } from "@/components/auth/auth-field";
import { FireflyField } from "@/components/FireflyField";
import { HeroPin } from "@/components/landing/hero-pin";
import { PendingButton } from "@/components/ui/pending-button";
import { signInWithEmail, signUpWithEmail } from "@/lib/actions/auth";
import { isPrelaunchLockedPath } from "@/lib/launch/config";
import type { AccountType, BusinessType, Locale } from "@/types";

type Mode = "signin" | "signup";

type Props = {
  locale: Locale;
  initialMode?: Mode;
  initialAccountType?: AccountType;
};

function safeReturnPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  // Middleware may pass a locale-prefixed path; next-intl router expects unprefixed.
  const withoutLocale = raw.replace(/^\/(en|ro)(?=\/|$)/, "") || "/";
  return withoutLocale.startsWith("/") ? withoutLocale : `/${withoutLocale}`;
}

export function AuthPage({
  initialMode = "signin",
  initialAccountType = "person",
}: Props) {
  const tAuth = useTranslations("auth");
  const isPrelaunch = usePrelaunch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnToRaw = safeReturnPath(searchParams.get("next"));
  const returnTo =
    isPrelaunch && returnToRaw && isPrelaunchLockedPath(returnToRaw)
      ? null
      : returnToRaw;
  const [mode, setMode] = useState<Mode>(initialMode);
  const [accountType, setAccountType] = useState<AccountType>(initialAccountType);
  const [businessType, setBusinessType] = useState<BusinessType>("venue");
  const [showPass, setShowPass] = useState(false);
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [cui, setCui] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingCounty, setBillingCounty] = useState("");
  const [billingPostalCode, setBillingPostalCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [confirmedAge, setConfirmedAge] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const isBusiness = accountType === "business";

  const clearTypeSpecificFields = () => {
    setName("");
    setBusinessName("");
    setLegalName("");
    setCui("");
    setBillingAddress("");
    setBillingCity("");
    setBillingCounty("");
    setBillingPostalCode("");
    setAcceptedLegal(false);
    setConfirmedAge(false);
    setError("");
  };

  const handleAccountTypeChange = (next: AccountType) => {
    setAccountType(next);
    clearTypeSpecificFields();
  };

  const handleModeChange = (next: Mode) => {
    setMode(next);
    clearTypeSpecificFields();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (mode === "signup" && isBusiness && businessName.trim().length < 2) {
      setError("Business name must be at least 2 characters");
      return;
    }

    if (
      mode === "signup" &&
      isBusiness &&
      (!legalName.trim() ||
        !cui.trim() ||
        !billingAddress.trim() ||
        !billingCity.trim() ||
        !billingCounty.trim() ||
        !billingPostalCode.trim())
    ) {
      setError("Please fill in all billing details");
      return;
    }

    if (mode === "signup" && (!acceptedLegal || !confirmedAge)) {
      setError(tAuth("mustAcceptLegal"));
      return;
    }

    startTransition(async () => {
      const result =
        mode === "signin"
          ? await signInWithEmail(email, password, accountType, rememberMe)
          : await signUpWithEmail(email, password, accountType, {
              displayName: name.trim() || undefined,
              businessName: isBusiness ? businessName.trim() : undefined,
              businessType: isBusiness ? businessType : undefined,
              billing: isBusiness
                ? {
                    legalName: legalName.trim(),
                    cui: cui.trim(),
                    billingAddress: billingAddress.trim(),
                    billingCity: billingCity.trim(),
                    billingCounty: billingCounty.trim(),
                    billingPostalCode: billingPostalCode.trim(),
                    billingCountry: "RO",
                  }
                : undefined,
            });

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push(returnTo ?? result.data.redirectTo);
      router.refresh();
    });
  };

  const subtitle =
    mode === "signin"
      ? isBusiness
        ? "Manage your venue or events. Pick up where you left off."
        : "Your saved fireflies are waiting. Pick up where the night left off."
      : isBusiness
        ? "Register your venue or organizer account and start reaching the night crowd."
        : "Save events, collect nights, and follow the light wherever it goes.";

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-firefly/10 blur-3xl" />
      <FireflyField count={32} />

      <Link
        href="/"
        className="absolute left-6 top-6 z-30 inline-flex items-center gap-2 text-sm text-foreground/60 transition-colors hover:text-firefly"
      >
        <span className="inline-flex h-2 w-2 animate-firefly-pulse rounded-full bg-firefly" />
        <span className="font-display tracking-tight-logo">firefly</span>
      </Link>

      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-0 lg:grid-cols-[1.1fr_1fr]">
        <aside className="relative hidden items-center justify-center p-12 lg:flex">
          <div className="relative flex h-[min(70vh,520px)] items-center justify-center">
            <HeroPin className="h-full" />
          </div>

          <div className="absolute bottom-12 left-12 right-12">
            <div className="deco-line mb-4" />
            <p className="max-w-md font-hand text-2xl leading-snug text-foreground/80">
              &ldquo;The best parties aren&apos;t found. They&apos;re{" "}
              <span className="text-firefly">followed.</span>&rdquo;
            </p>
            <p className="mt-2 font-mono text-xs tracking-wider-2 text-foreground/40">
              — A FIREFLY, PROBABLY
            </p>
          </div>
        </aside>

        <section className="relative flex items-center justify-center px-6 py-24 sm:px-12">
          <div className="w-full max-w-md">
            <div className="mb-10">
              <p className="mb-3 font-mono text-xs tracking-wider-2 text-firefly/80">
                {mode === "signin" ? "WELCOME BACK" : "NEW HERE"}
              </p>
              <h1 className="font-heading text-5xl font-bold leading-[0.95] tracking-tight-logo text-foreground sm:text-6xl">
                {mode === "signin" ? (
                  <>
                    Step back <br />
                    into the{" "}
                    <span className="bg-gradient-to-r from-white to-firefly bg-clip-text text-transparent text-glow italic">
                      night
                    </span>
                  </>
                ) : (
                  <>
                    Open the <br />
                    <span className="underline-squiggle bg-gradient-to-r from-white to-firefly bg-clip-text text-transparent text-glow italic">
                      jar
                    </span>
                  </>
                )}
              </h1>
              <p className="mt-4 text-pretty text-foreground/60">{subtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AccountTypeSwitch
                value={accountType}
                onChange={handleAccountTypeChange}
              />

              {mode === "signup" && !isBusiness ? (
                <AuthField icon={<User className="h-4 w-4" />} label="Your name">
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="What should we call you?"
                    className="w-full bg-transparent text-foreground outline-none placeholder:text-foreground/30"
                  />
                </AuthField>
              ) : null}

              {mode === "signup" && isBusiness ? (
                <>
                  <AuthField
                    icon={<Building2 className="h-4 w-4" />}
                    label="Business name"
                  >
                    <input
                      type="text"
                      value={businessName}
                      onChange={(event) => setBusinessName(event.target.value)}
                      placeholder="Your venue or brand name"
                      required
                      minLength={2}
                      className="w-full bg-transparent text-foreground outline-none placeholder:text-foreground/30"
                    />
                  </AuthField>

                  <div>
                    <span className="font-mono text-[10px] tracking-wider-2 text-foreground/40">
                      BUSINESS TYPE
                    </span>
                    <div className="mt-1.5">
                      <BusinessTypeSwitch
                        value={businessType}
                        onChange={setBusinessType}
                      />
                    </div>
                  </div>

                  <AuthField
                    icon={<Building2 className="h-4 w-4" />}
                    label="Legal company name"
                  >
                    <input
                      type="text"
                      value={legalName}
                      onChange={(event) => setLegalName(event.target.value)}
                      placeholder="SC Example SRL"
                      required
                      minLength={2}
                      className="w-full bg-transparent text-foreground outline-none placeholder:text-foreground/30"
                    />
                  </AuthField>

                  <AuthField
                    icon={<Building2 className="h-4 w-4" />}
                    label="CUI"
                  >
                    <input
                      type="text"
                      value={cui}
                      onChange={(event) => setCui(event.target.value)}
                      placeholder="RO12345678"
                      required
                      minLength={2}
                      className="w-full bg-transparent text-foreground outline-none placeholder:text-foreground/30"
                    />
                  </AuthField>

                  <AuthField
                    icon={<Building2 className="h-4 w-4" />}
                    label="Billing address"
                  >
                    <input
                      type="text"
                      value={billingAddress}
                      onChange={(event) => setBillingAddress(event.target.value)}
                      placeholder="Street, number"
                      required
                      minLength={2}
                      className="w-full bg-transparent text-foreground outline-none placeholder:text-foreground/30"
                    />
                  </AuthField>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <AuthField
                      icon={<Building2 className="h-4 w-4" />}
                      label="City"
                    >
                      <input
                        type="text"
                        value={billingCity}
                        onChange={(event) => setBillingCity(event.target.value)}
                        placeholder="Bucharest"
                        required
                        className="w-full bg-transparent text-foreground outline-none placeholder:text-foreground/30"
                      />
                    </AuthField>
                    <AuthField
                      icon={<Building2 className="h-4 w-4" />}
                      label="County"
                    >
                      <input
                        type="text"
                        value={billingCounty}
                        onChange={(event) =>
                          setBillingCounty(event.target.value)
                        }
                        placeholder="București"
                        required
                        className="w-full bg-transparent text-foreground outline-none placeholder:text-foreground/30"
                      />
                    </AuthField>
                  </div>

                  <AuthField
                    icon={<Building2 className="h-4 w-4" />}
                    label="Postal code"
                  >
                    <input
                      type="text"
                      value={billingPostalCode}
                      onChange={(event) =>
                        setBillingPostalCode(event.target.value)
                      }
                      placeholder="010101"
                      required
                      className="w-full bg-transparent text-foreground outline-none placeholder:text-foreground/30"
                    />
                  </AuthField>
                </>
              ) : null}

              <AuthField icon={<Mail className="h-4 w-4" />} label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@aftersunset.com"
                  required
                  className="w-full bg-transparent text-foreground outline-none placeholder:text-foreground/30"
                />
              </AuthField>

              <AuthField icon={<Lock className="h-4 w-4" />} label="Password">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-transparent text-foreground outline-none placeholder:text-foreground/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((current) => !current)}
                  className="text-foreground/40 transition-colors hover:text-firefly"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </AuthField>

              {mode === "signin" ? (
                <div className="flex items-center justify-between text-xs">
                  <label className="flex cursor-pointer items-center gap-2 text-foreground/60">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      className="accent-firefly"
                    />
                    Stay glowing
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-firefly/80 transition-colors hover:text-firefly"
                  >
                    Forgot password?
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 text-xs text-foreground/65">
                  <label className="flex cursor-pointer items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={acceptedLegal}
                      onChange={(event) =>
                        setAcceptedLegal(event.target.checked)
                      }
                      className="mt-0.5 accent-firefly"
                      required
                    />
                    <span>
                      {tAuth("agreeTermsPrefix")}{" "}
                      <Link
                        href="/terms"
                        className="text-firefly/90 underline-offset-2 hover:underline"
                      >
                        {tAuth("termsLink")}
                      </Link>{" "}
                      {tAuth("agreeTermsMiddle")}{" "}
                      <Link
                        href="/privacy"
                        className="text-firefly/90 underline-offset-2 hover:underline"
                      >
                        {tAuth("privacyLink")}
                      </Link>
                      .
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={confirmedAge}
                      onChange={(event) =>
                        setConfirmedAge(event.target.checked)
                      }
                      className="mt-0.5 accent-firefly"
                      required
                    />
                    <span>{tAuth("agreeAge")}</span>
                  </label>
                </div>
              )}

              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}

              <PendingButton
                type="submit"
                pending={pending}
                pendingLabel={
                  mode === "signin" ? "Signing in…" : "Creating account…"
                }
                className="group mt-2 w-full rounded-full bg-firefly px-6 py-3.5 text-sm font-medium text-primary-foreground transition-all hover:scale-[1.01] hover:firefly-glow"
              >
                {mode === "signin"
                  ? isBusiness
                    ? "Enter business dashboard"
                    : "Find my fireflies"
                  : isBusiness
                    ? "Register business"
                    : "Light the jar"}
                {!pending ? (
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                ) : null}
              </PendingButton>
            </form>

            <p className="mt-8 text-center text-sm text-foreground/60">
              {mode === "signin" ? "First night out?" : "Already a regular?"}{" "}
              <button
                type="button"
                onClick={() =>
                  handleModeChange(mode === "signin" ? "signup" : "signin")
                }
                className="font-medium text-firefly underline-offset-4 hover:underline"
              >
                {mode === "signin" ? "Create an account" : "Sign in"}
              </button>
            </p>

            <p className="mt-10 text-center font-mono text-[10px] tracking-wider-2 text-foreground/30">
              BY JOINING YOU AGREE TO DANCE RESPONSIBLY ✦
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
