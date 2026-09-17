import { headers } from "next/headers";

function runtimeEnv(parts: readonly string[]): string {
  return String(process.env[parts.join("_")] ?? "").trim();
}

function stripSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function configuredAppUrl(): string {
  return stripSlash(runtimeEnv(["NEXT", "PUBLIC", "APP", "URL"]));
}

function httpsHost(host: string): string {
  return `https://${host.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
}

export function isAllowedAppHost(host: string): boolean {
  const hostname = host
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .split(":")[0]
    .toLowerCase();
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  if (hostname.endsWith(".vercel.app")) return true;
  if (hostname === "fireflyapp.ro" || hostname === "www.fireflyapp.ro") {
    return true;
  }
  return false;
}

/**
 * Public origin for redirects (Stripe Checkout, billing portal).
 * Production stays on NEXT_PUBLIC_APP_URL. Preview uses the request host
 * so sandbox checkout does not send people to fireflyapp.ro.
 */
export async function getPublicAppUrl(): Promise<string> {
  if (runtimeEnv(["VERCEL", "ENV"]) === "production") {
    return configuredAppUrl() || "https://www.fireflyapp.ro";
  }

  try {
    const h = await headers();
    const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "")
      .split(",")[0]
      .trim();
    if (host && isAllowedAppHost(host)) {
      const isLocal =
        host.startsWith("localhost") || host.startsWith("127.0.0.1");
      const proto = (
        h.get("x-forwarded-proto") ?? (isLocal ? "http" : "https")
      )
        .split(",")[0]
        .trim();
      return `${proto}://${host}`;
    }
  } catch {
    // headers() throws outside a request
  }

  const previewHost =
    runtimeEnv(["VERCEL", "BRANCH", "URL"]) || runtimeEnv(["VERCEL", "URL"]);
  if (previewHost) return httpsHost(previewHost);

  return configuredAppUrl() || "http://localhost:3000";
}
