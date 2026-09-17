import { getTranslations } from "next-intl/server";

export async function BusinessPromotionsComingSoon() {
  const t = await getTranslations("prelaunch");
  const tBusiness = await getTranslations("business");

  return (
    <div data-route="business-promotions-coming-soon">
      <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
        {tBusiness("promotionsEyebrow")}
      </div>
      <h1 className="font-heading text-4xl font-bold">
        {t("promotionsComingSoonTitle")}
      </h1>
      <div className="glass mt-10 max-w-xl rounded-2xl p-8">
        <p className="font-mono text-[11px] uppercase tracking-wider-2 text-firefly">
          {t("promotionsSoon")}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-foreground/70">
          {t("promotionsComingSoonBody")}
        </p>
      </div>
    </div>
  );
}
