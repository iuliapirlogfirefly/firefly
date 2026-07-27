import { createClient } from "@/lib/supabase/server";
import { shouldUseMockData } from "@/lib/supabase/config";
import { getLocalizedField } from "@/lib/i18n/content";
import type { Locale, FeedPostCategory } from "@/types";
import type { CreateFeedPostInput } from "@/types/events";
import { getMockFeedPosts, getMockPendingFeedPosts } from "@/lib/mocks/data";
import { filterMissedPosts } from "@/lib/utils/feed-filters";

export type FeedPostItem = {
  id: string;
  category: FeedPostCategory;
  title: string;
  description: string;
  mediaUrl: string | null;
  publishedAt: string;
  isPromoted: boolean;
};

async function getActiveFeedPostPromotionIds(): Promise<Set<string>> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("promotions")
    .select("target_id")
    .eq("type", "feed_post")
    .eq("is_active", true)
    .gt("expires_at", now);

  return new Set((data ?? []).map((row) => row.target_id));
}

export async function getFeedPosts(
  locale: Locale,
  limit = 20
): Promise<FeedPostItem[]> {
  if (shouldUseMockData()) return getMockFeedPosts(locale).slice(0, limit);

  const supabase = await createClient();
  const [postsResult, promotedIds] = await Promise.all([
    supabase
      .from("feed_posts")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit * 2),
    getActiveFeedPostPromotionIds(),
  ]);

  if (postsResult.error) throw postsResult.error;

  const items = (postsResult.data ?? []).map((post) => ({
    id: post.id,
    category: post.category as FeedPostCategory,
    title: getLocalizedField(
      post.translations as Parameters<typeof getLocalizedField>[0],
      locale,
      "title"
    ),
    description: getLocalizedField(
      post.translations as Parameters<typeof getLocalizedField>[0],
      locale,
      "description"
    ),
    mediaUrl: post.media_url,
    publishedAt: post.published_at ?? post.created_at,
    isPromoted: promotedIds.has(post.id),
  }));

  return items
    .sort((a, b) => {
      if (a.isPromoted !== b.isPromoted) return a.isPromoted ? -1 : 1;
      return (
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
    })
    .slice(0, limit);
}

export async function getMissedPosts(
  locale: Locale,
  limit = 30
): Promise<FeedPostItem[]> {
  const posts = await getFeedPosts(locale, limit);
  return filterMissedPosts(posts);
}

export async function getPendingFeedPosts(locale: Locale): Promise<
  (FeedPostItem & { status: string; rejectionReason: string | null })[]
> {
  if (shouldUseMockData()) return getMockPendingFeedPosts(locale);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feed_posts")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((post) => ({
    id: post.id,
    category: post.category as FeedPostCategory,
    title: getLocalizedField(
      post.translations as Parameters<typeof getLocalizedField>[0],
      locale,
      "title"
    ),
    description: getLocalizedField(
      post.translations as Parameters<typeof getLocalizedField>[0],
      locale,
      "description"
    ),
    mediaUrl: post.media_url,
    publishedAt: post.created_at,
    isPromoted: false,
    status: post.status,
    rejectionReason: post.rejection_reason,
  }));
}

export type BusinessFeedPostItem = FeedPostItem & {
  status: string;
  rejectionReason?: string | null;
};

export async function getBusinessFeedPosts(
  businessAccountId: string,
  locale: Locale
): Promise<BusinessFeedPostItem[]> {
  if (shouldUseMockData()) {
    return getMockFeedPosts(locale).slice(0, 4).map((post, index) => ({
      ...post,
      status: index === 0 ? "pending" : "published",
    }));
  }

  const { isSupabaseConfigured } = await import("@/lib/supabase/config");
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feed_posts")
    .select("*")
    .eq("business_account_id", businessAccountId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((post) => ({
    id: post.id,
    category: post.category as FeedPostCategory,
    title: getLocalizedField(
      post.translations as Parameters<typeof getLocalizedField>[0],
      locale,
      "title"
    ),
    description: getLocalizedField(
      post.translations as Parameters<typeof getLocalizedField>[0],
      locale,
      "description"
    ),
    mediaUrl: post.media_url,
    publishedAt: post.published_at ?? post.created_at,
    isPromoted: false,
    status: post.status,
    rejectionReason: post.rejection_reason,
  }));
}

export type BusinessFeedPostForEdit = CreateFeedPostInput & {
  id: string;
  status: string;
  rejectionReason: string | null;
};

export async function getBusinessFeedPostForEdit(
  postId: string,
  businessAccountId: string
): Promise<BusinessFeedPostForEdit | null> {
  if (shouldUseMockData()) {
    const mock = getMockFeedPosts("en").find((p) => p.id === postId);
    if (!mock) return null;
    return {
      id: mock.id,
      status: "published",
      rejectionReason: null,
      category: mock.category,
      translations: {
        en: { title: mock.title, description: mock.description },
      },
      mediaUrl: mock.mediaUrl ?? undefined,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feed_posts")
    .select("*")
    .eq("id", postId)
    .eq("business_account_id", businessAccountId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const translations = data.translations as CreateFeedPostInput["translations"];

  return {
    id: data.id,
    status: data.status,
    rejectionReason: data.rejection_reason,
    category: data.category as FeedPostCategory,
    translations,
    mediaUrl: data.media_url ?? undefined,
  };
}
