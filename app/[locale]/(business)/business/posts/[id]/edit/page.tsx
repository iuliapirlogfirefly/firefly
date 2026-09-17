import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { BusinessFeedPostForm } from "@/components/business/business-feed-post-form";
import { MOCK_BUSINESS_ACCOUNT_ID } from "@/lib/mocks/data";
import { getSession } from "@/lib/auth/session";
import { getBusinessFeedPostForEdit } from "@/lib/queries/feed";
import { shouldUseMockData } from "@/lib/supabase/config";

type Props = {
  params: Promise<{ locale: "en" | "ro"; id: string }>;
};

export default async function EditFeedPostPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  const businessId = shouldUseMockData()
    ? MOCK_BUSINESS_ACCOUNT_ID
    : session.businessAccountId;

  if (!businessId) {
    redirect(`/${locale}/business`);
  }

  const post = await getBusinessFeedPostForEdit(id, businessId);
  if (!post) {
    notFound();
  }

  return (
    <div data-route="business-posts-edit">
      <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
        ◦ Business · Edit post
      </div>
      <h1 className="mb-8 font-heading text-4xl font-bold">
        Edit <span className="text-gradient-firefly">post</span>
      </h1>

      <BusinessFeedPostForm
        mode="edit"
        postId={post.id}
        initial={post}
      />
    </div>
  );
}
