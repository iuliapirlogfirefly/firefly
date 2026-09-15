import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BusinessFeedPostSection } from "@/components/business/business-feed-post-form";
import { BusinessPostsList } from "@/components/business/business-posts-list";
import { MOCK_BUSINESS_ACCOUNT_ID } from "@/lib/mocks/data";
import { getSession } from "@/lib/auth/session";
import { getBusinessFeedPosts } from "@/lib/queries/feed";
import { shouldUseMockData } from "@/lib/supabase/config";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export default async function BusinessPostsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  const businessId = shouldUseMockData()
    ? MOCK_BUSINESS_ACCOUNT_ID
    : session.businessAccountId;

  const posts = businessId
    ? await getBusinessFeedPosts(businessId, locale)
    : [];

  return (
    <div data-route="business-posts">
        <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
          ◦ Business · What Did You Miss posts
        </div>
        <h1 className="font-heading text-4xl font-bold">
          Your <span className="text-gradient-firefly">stories</span>
        </h1>
        <p className="mt-3 text-foreground/60">
          Submit nightlife updates for the public feed.
        </p>

        {businessId ? (
          <BusinessFeedPostSection locale={locale} />
        ) : (
          <div className="glass mt-8 rounded-2xl p-8 text-center">
            <p className="text-sm text-foreground/60">
              Register and get your business account approved to submit What
              Did You Miss posts.
            </p>
            <Link
              href="/business"
              className="mt-4 inline-flex rounded-full bg-firefly px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Go to business dashboard
            </Link>
          </div>
        )}
        <BusinessPostsList posts={posts} locale={locale} />
    </div>
  );
}
