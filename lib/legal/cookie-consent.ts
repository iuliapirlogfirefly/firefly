export const COOKIE_CONSENT_NAME = "ff_cookie_consent";
export const COOKIE_CONSENT_VERSION = 1;
export const COOKIE_CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

export type ConsentCategory = "necessary" | "analytics" | "marketing";

export type CookieConsent = {
  version: number;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

export const DEFAULT_REJECTED_CONSENT: CookieConsent = {
  version: COOKIE_CONSENT_VERSION,
  necessary: true,
  analytics: false,
  marketing: false,
  updatedAt: new Date(0).toISOString(),
};

export function createConsent(partial: {
  analytics: boolean;
  marketing: boolean;
}): CookieConsent {
  return {
    version: COOKIE_CONSENT_VERSION,
    necessary: true,
    analytics: partial.analytics,
    marketing: partial.marketing,
    updatedAt: new Date().toISOString(),
  };
}

export function parseConsent(raw: string | undefined | null): CookieConsent | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(decodeURIComponent(raw)) as Partial<CookieConsent>;
    if (data.version !== COOKIE_CONSENT_VERSION) return null;
    if (typeof data.analytics !== "boolean") return null;
    if (typeof data.marketing !== "boolean") return null;
    return {
      version: COOKIE_CONSENT_VERSION,
      necessary: true,
      analytics: data.analytics,
      marketing: data.marketing,
      updatedAt:
        typeof data.updatedAt === "string"
          ? data.updatedAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function serializeConsent(consent: CookieConsent): string {
  return encodeURIComponent(JSON.stringify(consent));
}

function readBrowserCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  if (!match) return null;
  return match.slice(name.length + 1);
}

export function getStoredConsent(): CookieConsent | null {
  return parseConsent(readBrowserCookie(COOKIE_CONSENT_NAME));
}

export function writeConsent(consent: CookieConsent): void {
  if (typeof document === "undefined") return;
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${COOKIE_CONSENT_NAME}=${serializeConsent(consent)}; Path=/; Max-Age=${COOKIE_CONSENT_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
  window.dispatchEvent(
    new CustomEvent("ff:cookie-consent", { detail: consent })
  );
}

export function clearConsent(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_CONSENT_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
  window.dispatchEvent(new CustomEvent("ff:cookie-consent-open"));
}

/** Open the banner again (e.g. from footer “Manage cookies”). */
export function requestConsentPreferences(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("ff:cookie-consent-open"));
}

export function hasConsent(category: ConsentCategory): boolean {
  if (category === "necessary") return true;
  const stored = getStoredConsent();
  if (!stored) return false;
  return stored[category] === true;
}
