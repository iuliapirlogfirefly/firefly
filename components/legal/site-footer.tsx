import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  CONSUMER_PROTECTION_LINKS,
  getLegalCompany,
} from "@/lib/legal/company";
import { ManageCookiesButton } from "./manage-cookies-button";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const company = getLegalCompany();
  const year = new Date().getFullYear();

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
              href="/business"
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
        </div>

        <div className="space-y-3 text-sm text-foreground/55">
          <h2 className="font-mono text-[11px] uppercase tracking-wider-2 text-foreground/40">
            {t("operatorHeading")}
          </h2>
          <p className="font-medium text-foreground/80">{company.legalName}</p>
          <dl className="space-y-1.5">
            <div>
              <dt className="inline text-foreground/40">{t("cui")}: </dt>
              <dd className="inline">{company.cui}</dd>
            </div>
            <div>
              <dt className="inline text-foreground/40">
                {t("tradeRegister")}:{" "}
              </dt>
              <dd className="inline">{company.tradeRegister}</dd>
            </div>
            <div>
              <dt className="inline text-foreground/40">{t("address")}: </dt>
              <dd className="inline">{company.address}</dd>
            </div>
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
            {company.phone ? (
              <div>
                <dt className="inline text-foreground/40">{t("phone")}: </dt>
                <dd className="inline">
                  <a
                    href={`tel:${company.phone}`}
                    className="transition-colors hover:text-firefly"
                  >
                    {company.phone}
                  </a>
                </dd>
              </div>
            ) : null}
            {company.caen ? (
              <div>
                <dt className="inline text-foreground/40">{t("caen")}: </dt>
                <dd className="inline">{company.caen}</dd>
              </div>
            ) : null}
            {company.authorizations ? (
              <div>
                <dt className="inline text-foreground/40">
                  {t("authorizations")}:{" "}
                </dt>
                <dd className="inline">{company.authorizations}</dd>
              </div>
            ) : null}
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
