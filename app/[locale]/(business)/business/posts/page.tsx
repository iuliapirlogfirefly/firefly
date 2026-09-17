import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BusinessFeedPostSection } from "@/components/business/business-feed-post-form";
import { BusinessPostsList } from "@/components/business/business-posts-list";
import { MOCK_BUSINESS_ACCOUNT_ID } from "@/lib/mocks/data";
import { getSession } from "@/lib/auth/session";
import { getBusinessFeedPosts } from "@/lib/queries/feed";
import { getFeedPostCreditBalance } from "@/lib/stripe/feed-post-credits";
import { shouldUseMockData } from "@/lib/supabase/config";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export default async function BusinessPostsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("business");

  const session = await getSession();
  const businessId = shouldUseMockData()
    ? MOCK_BUSINESS_ACCOUNT_ID
    : session.businessAccountId;

  const [posts, credits] = businessId
    ? await Promise.all([
        getBusinessFeedPosts(businessId, locale),
        getFeedPostCreditBalance(businessId),
      ])
    : [
        [],
        {
          premiumUsed: 0,
          premiumQuota: 0,
          packUsed: 0,
          packQuota: 0,
          remaining: 0,
        },
      ];

  return (
    <div data-route="business-posts">
        <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
          {t("postsEyebrow")}
        </div>
        <h1 className="font-heading text-4xl font-bold">
          {t.rich("postsHeadline", {
            glow: (chunks) => (
              <span className="text-gradient-firefly">{chunks}</span>
            ),
          })}
        </h1>
        <p className="mt-3 text-foreground/60">{t("postsIntro")}</p>

        {businessId ? (
          credits.remaining > 0 ? (
            <>
              <p className="mt-4 font-mono text-[11px] uppercase tracking-wider-2 text-firefly">
                {t("postsSlotsRemaining", { count: credits.remaining })}
              </p>
              <BusinessFeedPostSection />
            </>
          ) : (
            <div className="glass mt-8 rounded-2xl p-8 text-center">
              <p className="text-sm text-foreground/60">{t("postsNoSlots")}</p>
              <Link
                href="/business/promotions"
                className="mt-4 inline-flex rounded-full bg-firefly px-5 py-2.5 text-sm font-medium text-primary-foreground"
              >
                {t("postsGetSlots")}
              </Link>
            </div>
          )
        ) : (
          <div className="glass mt-8 rounded-2xl p-8 text-center">
            <p className="text-sm text-foreground/60">
              {t("postsNeedsApproval")}
            </p>
            <Link
              href="/business"
              className="mt-4 inline-flex rounded-full bg-firefly px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              {t("goToDashboard")}
            </Link>
          </div>
        )}
        <BusinessPostsList posts={posts} />
    </div>
  );
}
