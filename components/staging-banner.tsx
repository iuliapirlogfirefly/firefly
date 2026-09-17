import { getTranslations } from "next-intl/server";

/**
 * Non-blocking marker so Preview deploys are never mistaken for fireflyapp.ro.
 * Vercel sets VERCEL_ENV=preview for non-production deployments.
 */
export async function StagingBanner() {
  if (process.env.VERCEL_ENV !== "preview") return null;

  const t = await getTranslations("common");

  return (
    <div
      role="status"
      className="sticky top-0 z-[70] border-b border-amber-warm/40 bg-amber-deep px-3 py-1.5 text-center text-xs font-medium tracking-wide text-primary-foreground"
    >
      {t("stagingBanner")}
    </div>
  );
}
