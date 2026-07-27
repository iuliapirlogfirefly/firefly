import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { verifyNewsletterUnsubscribeToken } from "@/lib/newsletter/unsubscribe-token";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function NewsletterUnsubscribePage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const { token } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("newsletter");

  let status: "success" | "invalid" | "error" = "invalid";

  if (token && isSupabaseAdminConfigured()) {
    const userId = verifyNewsletterUnsubscribeToken(token);
    if (userId) {
      try {
        const admin = createAdminClient();
        const { error } = await admin
          .from("profiles")
          .update({ newsletter_opt_in: false })
          .eq("id", userId);

        status = error ? "error" : "success";
      } catch {
        status = "error";
      }
    }
  }

  const title =
    status === "success"
      ? t("unsubscribedTitle")
      : status === "error"
        ? t("unsubscribeErrorTitle")
        : t("unsubscribeInvalidTitle");

  const body =
    status === "success"
      ? t("unsubscribedBody")
      : status === "error"
        ? t("unsubscribeErrorBody")
        : t("unsubscribeInvalidBody");

  return (
    <main
      data-route="unsubscribe-newsletter"
      className="relative flex min-h-screen items-center justify-center px-6"
    >
      <div className="glass max-w-md rounded-3xl p-8 text-center">
        <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
          ◦ Firefly
        </div>
        <h1 className="font-heading text-3xl font-bold">{title}</h1>
        <p className="mt-3 text-sm text-foreground/60">{body}</p>
        <Link
          href="/profile"
          className="mt-8 inline-flex rounded-full bg-firefly px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:firefly-glow"
        >
          {t("manageInAccount")}
        </Link>
      </div>
    </main>
  );
}
