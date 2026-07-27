import { createHmac, timingSafeEqual } from "crypto";

const PURPOSE = "newsletter_unsub" as const;

type TokenPayload = {
  uid: string;
  p: typeof PURPOSE;
};

function getSecret(): string {
  const secret =
    process.env.NEWSLETTER_UNSUBSCRIBE_SECRET ||
    process.env.CRON_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY;

  if (!secret) {
    throw new Error("Missing secret for newsletter unsubscribe tokens");
  }

  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function createNewsletterUnsubscribeToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, p: PURPOSE } satisfies TokenPayload)
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyNewsletterUnsubscribeToken(
  token: string
): string | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  try {
    if (!safeEqual(sign(payload), signature)) return null;

    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as TokenPayload;

    if (parsed.p !== PURPOSE || typeof parsed.uid !== "string" || !parsed.uid) {
      return null;
    }

    return parsed.uid;
  } catch {
    return null;
  }
}

export function buildNewsletterUnsubscribeUrl(
  userId: string,
  locale: "en" | "ro" = "en"
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const token = createNewsletterUnsubscribeToken(userId);
  return `${appUrl}/${locale}/unsubscribe/newsletter?token=${encodeURIComponent(token)}`;
}

export function wrapNewsletterHtml(
  htmlContent: string,
  unsubscribeUrl: string,
  locale: "en" | "ro" = "en"
): string {
  const label =
    locale === "ro" ? "Dezabonează-te" : "Unsubscribe";
  const hint =
    locale === "ro"
      ? "Nu mai dorești aceste emailuri?"
      : "Don't want these emails anymore?";

  return `${htmlContent}
<hr style="border:none;border-top:1px solid #e5e5e5;margin:32px 0 16px;" />
<p style="font-size:12px;color:#888;line-height:1.5;">
  ${hint}
  <a href="${unsubscribeUrl}" style="color:#888;text-decoration:underline;">${label}</a>
</p>`;
}
