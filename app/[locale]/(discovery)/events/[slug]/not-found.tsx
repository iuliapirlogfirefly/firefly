import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function EventNotFound() {
  const t = await getTranslations("event");

  return (
    <main className="flex min-h-screen items-center justify-center px-6 text-center">
      <div>
        <h1 className="mb-3 font-display text-5xl">{t("notFoundTitle")}</h1>
        <p className="mb-6 text-foreground/60">{t("notFoundBody")}</p>
        <Link
          href="/feed"
          className="inline-flex rounded-full bg-firefly px-5 py-2.5 text-primary-foreground"
        >
          {t("backToFeed")}
        </Link>
      </div>
    </main>
  );
}
