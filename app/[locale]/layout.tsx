import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import {
  Caveat,
  Inter,
  JetBrains_Mono,
  Limelight,
  Syne,
} from "next/font/google";
import { notFound } from "next/navigation";
import NextTopLoader from "nextjs-toploader";
import { CookieConsentBanner } from "@/components/legal/cookie-consent-banner";
import { StagingBanner } from "@/components/staging-banner";
import { SiteFooter } from "@/components/legal/site-footer";
import { SessionProvider } from "@/components/session-provider";
import { LaunchProvider } from "@/components/launch-provider";
import { routing } from "@/i18n/routing";
import { getSession } from "@/lib/auth/session";
import { isPrelaunchActive } from "@/lib/launch/settings";
import "../globals.css";

const limelight = Limelight({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-limelight",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "ro")) {
    notFound();
  }

  setRequestLocale(locale);
  const [messages, session, isPrelaunch] = await Promise.all([
    getMessages(),
    getSession(),
    isPrelaunchActive(),
  ]);

  return (
    <html
      lang={locale}
      className={`dark ${limelight.variable} ${syne.variable} ${inter.variable} ${caveat.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <NextTopLoader
          color="#FEF7A3"
          height={3}
          showSpinner={false}
          crawl
          easing="ease"
        />
        <NextIntlClientProvider messages={messages}>
          <LaunchProvider isPrelaunch={isPrelaunch}>
            <SessionProvider initialSession={session}>
              <StagingBanner />
              {children}
              <SiteFooter />
              <CookieConsentBanner />
            </SessionProvider>
          </LaunchProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
