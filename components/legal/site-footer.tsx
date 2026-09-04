import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  CONSUMER_PROTECTION_LINKS,
  SOCIAL_LINKS,
  getLegalCompany,
} from "@/lib/legal/company";
import { ManageCookiesButton } from "./manage-cookies-button";
import { isPrelaunchActive } from "@/lib/launch/settings";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const company = getLegalCompany();
  const year = new Date().getFullYear();
  const venuesHref = (await isPrelaunchActive())
    ? "/auth?mode=signup&type=business"
    : "/business";

  return (
    <footer className="relative border-t border-firefly/10 pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-12 md:pb-12">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-firefly animate-firefly-pulse" />
            </span>
            <span className="font-display text-lg tracking-tight-logo">
              firefly
            </span>
          </div>
          <p className="font-mono text-[11px] uppercase tracking-wider-2 text-foreground/40">
            {t("tagline")}
          </p>
          <p className="font-hand text-xl text-foreground/40">{t("madeBy")}</p>
          <div className="flex flex-wrap gap-4 pt-2 text-sm text-foreground/50">
            <Link
              href={venuesHref}
              className="transition-colors hover:text-firefly"
            >
              {t("forVenues")}
            </Link>
            <a
              href={`mailto:${company.email}`}
              className="transition-colors hover:text-firefly"
            >
              {t("contact")}
            </a>
            <ManageCookiesButton label={t("manageCookies")} />
          </div>
          <div className="flex items-center gap-3 pt-1">
            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("instagram")}
              title={t("instagram")}
              className="text-foreground/50 transition-colors hover:text-firefly"
            >
              <InstagramIcon className="h-5 w-5" />
            </a>
            <a
              href={SOCIAL_LINKS.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("tiktok")}
              title={t("tiktok")}
              className="text-foreground/50 transition-colors hover:text-firefly"
            >
              <TikTokIcon className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div className="space-y-3 text-sm text-foreground/55">
          <h2 className="font-mono text-[11px] uppercase tracking-wider-2 text-foreground/40">
            {t("operatorHeading")}
          </h2>
          <p className="font-medium text-foreground/80">{company.legalName}</p>
          <dl className="space-y-1.5">
            <div>
              <dt className="inline text-foreground/40">{t("email")}: </dt>
              <dd className="inline">
                <a
                  href={`mailto:${company.email}`}
                  className="transition-colors hover:text-firefly"
                >
                  {company.email}
                </a>
              </dd>
            </div>
          </dl>
        </div>

        <div className="space-y-3 text-sm">
          <h2 className="font-mono text-[11px] uppercase tracking-wider-2 text-foreground/40">
            {t("legalHeading")}
          </h2>
          <ul className="space-y-2 text-foreground/55">
            <li>
              <Link
                href="/terms"
                className="transition-colors hover:text-firefly"
              >
                {t("terms")}
              </Link>
            </li>
            <li>
              <Link
                href="/privacy"
                className="transition-colors hover:text-firefly"
              >
                {t("privacy")}
              </Link>
            </li>
            <li>
              <Link
                href="/cookies"
                className="transition-colors hover:text-firefly"
              >
                {t("cookies")}
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3 text-sm">
          <h2 className="font-mono text-[11px] uppercase tracking-wider-2 text-foreground/40">
            {t("consumerHeading")}
          </h2>
          <ul className="space-y-2 text-foreground/55">
            <li>
              <a
                href={CONSUMER_PROTECTION_LINKS.anpc}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-firefly"
              >
                {t("anpc")}
              </a>
            </li>
          </ul>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <a
              href={CONSUMER_PROTECTION_LINKS.anpcSal}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-90 transition-opacity hover:opacity-100"
              title={t("anpcSal")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/legal/anpc-sal.svg"
                alt={t("anpcSal")}
                width={120}
                height={40}
              />
            </a>
            <a
              href={CONSUMER_PROTECTION_LINKS.euSol}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-90 transition-opacity hover:opacity-100"
              title={t("euSol")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/legal/eu-sol.svg"
                alt={t("euSol")}
                width={120}
                height={40}
              />
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-[1400px] border-t border-firefly/5 px-6 pt-6">
        <p className="text-center font-mono text-[11px] uppercase tracking-wider-2 text-foreground/35">
          {t("copyright", { year, legalName: company.legalName })}
        </p>
      </div>
    </footer>
  );
}
