/**
 * Non-blocking marker so Preview deploys are never mistaken for fireflyapp.ro.
 * Vercel sets VERCEL_ENV=preview for non-production deployments.
 */
export function StagingBanner() {
  if (process.env.VERCEL_ENV !== "preview") return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-[70] border-b border-amber-warm/40 bg-amber-deep px-3 py-1.5 text-center text-xs font-medium tracking-wide text-primary-foreground"
    >
      Staging — test data only, not fireflyapp.ro
    </div>
  );
}
