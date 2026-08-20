/**
 * Operator identity for Romanian legal disclosures (footer, privacy, etc.).
 * Override via NEXT_PUBLIC_LEGAL_* env vars.
 */

function env(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value || undefined;
}

export type LegalCompany = {
  legalName: string;
  cui: string;
  tradeRegister: string;
  address: string;
  email: string;
  phone: string | null;
  /** CAEN / activity description — shown only when set */
  caen: string | null;
  /** Licenses / authorizations — shown only when set */
  authorizations: string | null;
};

const DEFAULT_ADDRESS =
  "Municipiul Pitești, Jud. Argeș, Strada Constructorilor, Nr. 11, Bl. C, Scara B, Etaj PARTER, Ap. 3";

export function getLegalCompany(): LegalCompany {
  return {
    legalName: env("NEXT_PUBLIC_LEGAL_NAME") ?? "FIREFLY CONCEPT SRL",
    cui: env("NEXT_PUBLIC_LEGAL_CUI") ?? "54945577",
    tradeRegister: env("NEXT_PUBLIC_LEGAL_TRADE_REGISTER") ?? "J2026039957007",
    address: env("NEXT_PUBLIC_LEGAL_ADDRESS") ?? DEFAULT_ADDRESS,
    email:
      env("NEXT_PUBLIC_LEGAL_EMAIL") ??
      env("NEXT_PUBLIC_SUPPORT_EMAIL") ??
      env("SUPPORT_EMAIL") ??
      "contact@fireflyapp.ro",
    phone:
      env("NEXT_PUBLIC_LEGAL_PHONE") ??
      env("NEXT_PUBLIC_SUPPORT_PHONE") ??
      env("SUPPORT_PHONE") ??
      null,
    caen: env("NEXT_PUBLIC_LEGAL_CAEN") ?? null,
    authorizations: env("NEXT_PUBLIC_LEGAL_AUTHORIZATIONS") ?? null,
  };
}

/** External consumer-protection links (Romania / EU). */
export const CONSUMER_PROTECTION_LINKS = {
  anpc: "https://anpc.ro/",
  anpcSal: "https://anpc.ro/ce-este-sal/",
  euSol: "https://ec.europa.eu/consumers/odr",
} as const;

export const STRIPE_PRIVACY_URL = "https://stripe.com/privacy";
