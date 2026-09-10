import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { FireflyField } from "@/components/FireflyField";
import { Nav } from "@/components/Nav";
import { Countdown } from "@/components/landing/countdown";
import { HeroPin } from "@/components/landing/hero-pin";
import { getSession, isBusinessRole } from "@/lib/auth/session";
import { formatLaunchAt, remainingUntil } from "@/lib/launch/config";
import { getLaunchAt } from "@/lib/launch/settings";

export async function PrelaunchLanding() {
  const [t, locale, session] = await Promise.all([
    getTranslations("prelaunch"),
    getLocale(),
    getSession(),
  ]);
  const launchAt = await getLaunchAt();
  const isLoggedIn = Boolean(session.userId);
  const isBusiness = isBusinessRole(session.role);
  const formattedLaunch = launchAt ? formatLaunchAt(launchAt, locale) : null;
  const launchesOnLabel = formattedLaunch
    ? t("launchesOn", { date: formattedLaunch })
    : t("badge");

  return (
    <main data-route="landing" className="relative overflow-x-clip">
      <Nav />

      <section className="relative min-h-[100vh] pt-24 pb-16 sm:pt-28 sm:pb-20">
        <FireflyField count={45} />
        <div
          className="pointer-events-none absolute -left-40 top-32 h-[520px] w-[520px] rounded-full opacity-70"
          style={{
            background:
              "radial-gradient(circle, rgba(254,247,163,0.18) 0%, transparent 65%)",
          }}
        />

        <div className="relative mx-auto grid max-w-[1400px] items-center gap-8 px-4 sm:gap-10 sm:px-6 lg:grid-cols-12">
          <div className="relative z-10 lg:col-span-7">
            <div className="glass mb-8 inline-flex animate-fade-up items-center gap-2 rounded-full px-3 py-1.5">
              <span className="relative inline-flex h-1.5 w-1.5">
                <span className="absolute inset-0 rounded-full bg-firefly animate-firefly-pulse" />
              </span>
              <span className="font-mono text-[11px] uppercase tracking-wider-2 text-foreground/80">
                {t("badge")}
              </span>
            </div>

            <h1
              className="font-heading font-bold tracking-tight-logo animate-fade-up text-balance leading-[0.88]"
              style={{ animationDelay: "0.1s" }}
            >
              <span className="block text-[14vw] sm:text-8xl md:text-[8.5rem]">
                {t("headlineFollow")}
              </span>
              <span className="-mt-2 block pl-[18%] text-[14vw] sm:-mt-3 sm:pl-[22%] sm:text-8xl md:text-[8.5rem]">
                {t("headlineThe")}{" "}
                <span className="bg-gradient-to-r from-white to-firefly bg-clip-text text-transparent text-glow italic">
                  {t("headlineLight")}
                </span>
              </span>
            </h1>

            <p
              className="mt-6 max-w-xl animate-fade-up text-pretty text-base leading-relaxed text-foreground/70 sm:mt-8 sm:text-lg"
              style={{ animationDelay: "0.25s" }}
            >
              {t("promise")}
            </p>

            {launchAt ? (
              <div
                className="mt-8 max-w-lg animate-fade-up sm:mt-10"
                style={{ animationDelay: "0.4s" }}
              >
                <Countdown
                  launchAtIso={launchAt.toISOString()}
                  initialRemaining={remainingUntil(launchAt)}
                  launchesOnLabel={launchesOnLabel}
                />
              </div>
            ) : null}

            {isLoggedIn ? (
              <div
                className="mt-8 max-w-md animate-fade-up sm:mt-10"
                style={{ animationDelay: "0.55s" }}
              >
                <p className="text-pretty text-base text-foreground/80 sm:text-lg">
                  {t("youreIn")}
                </p>
                {formattedLaunch ? (
                  <p className="mt-2 font-mono text-[11px] uppercase tracking-wider-2 text-firefly/80">
                    {t("opensOn", { date: formattedLaunch })}
                  </p>
                ) : null}
                {isBusiness ? (
                  <Link
                    href="/business"
                    className="group mt-6 inline-flex items-center gap-2 rounded-full bg-firefly px-7 py-4 font-medium text-primary-foreground transition-all hover:scale-[1.03] hover:firefly-glow"
                  >
                    {t("openDashboard")}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                ) : null}
              </div>
            ) : (
              <div
                className="mt-8 flex flex-wrap animate-fade-up items-center gap-3 sm:mt-10 sm:gap-4"
                style={{ animationDelay: "0.55s" }}
              >
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-2 rounded-full bg-firefly px-7 py-4 font-medium text-primary-foreground transition-all hover:scale-[1.03] hover:firefly-glow"
                >
                  {t("createAccount")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/auth"
                  className="inline-flex items-center gap-2 rounded-full border border-firefly/40 px-7 py-4 font-medium text-firefly transition-colors hover:bg-firefly/10"
                >
                  {t("signIn")}
                </Link>
              </div>
            )}
          </div>

          <div
            className="relative hidden h-[520px] animate-fade-up items-center justify-center lg:col-span-5 lg:flex"
            style={{ animationDelay: "0.35s" }}
          >
            <HeroPin className="h-[78%]" />
          </div>
        </div>
      </section>
    </main>
  );
}
