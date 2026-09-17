import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, shouldUseMockData } from "@/lib/supabase/config";
import { getLocalizedField } from "@/lib/i18n/content";
import type { Locale, FeedPostCategory } from "@/types";
import type { CreateFeedPostInput } from "@/types/events";
import {
  getMockAdminFeedPost,
  getMockFeedPosts,
  getMockPendingFeedPosts,
} from "@/lib/mocks/data";
import { filterMissedPosts } from "@/lib/utils/feed-filters";

export type FeedPostItem = {
  id: string;
  category: FeedPostCategory;
  title: string;
  description: string;
  mediaUrl: string | null;
  publishedAt: string;
};

export async function getFeedPosts(
  locale: Locale,
  limit = 20
): Promise<FeedPostItem[]> {
  if (shouldUseMockData()) return getMockFeedPosts(locale).slice(0, limit);

  const supabase = await createClient();
  const postsResult = await supabase
    .from("feed_posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (postsResult.error) throw postsResult.error;

  return (postsResult.data ?? []).map((post) => ({
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
  }));
}

export async function getMissedPosts(
  locale: Locale,
  limit = 30
): Promise<FeedPostItem[]> {
  const posts = await getFeedPosts(locale, limit);
  return filterMissedPosts(posts);
}

export async function getPendingFeedPosts(locale: Locale): Promise<
  (FeedPostItem & {
    status: string;
    rejectionReason: string | null;
    businessName: string | null;
  })[]
> {
  if (shouldUseMockData()) return getMockPendingFeedPosts(locale);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feed_posts")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) throw error;

  const rows = data ?? [];
  const businessIds = [
    ...new Set(
      rows
        .map((post) => post.business_account_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const businessNameById = new Map<string, string>();
  if (businessIds.length > 0) {
    const { data: businesses } = await supabase
      .from("business_accounts")
      .select("id, name")
      .in("id", businessIds);

    for (const business of businesses ?? []) {
      businessNameById.set(business.id, business.name);
    }
  }

  return rows.map((post) => ({
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
    status: post.status,
    rejectionReason: post.rejection_reason,
    businessName: post.business_account_id
      ? (businessNameById.get(post.business_account_id) ?? null)
      : null,
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

export type AdminFeedPostDetail = {
  id: string;
  category: FeedPostCategory;
  status: string;
  mediaUrl: string | null;
  translations: CreateFeedPostInput["translations"];
  businessAccountId: string | null;
  businessName: string | null;
  createdAt: string;
  publishedAt: string | null;
  rejectionReason: string | null;
};

export async function getAdminFeedPostDetail(
  id: string
): Promise<AdminFeedPostDetail | null> {
  if (shouldUseMockData()) {
    const mock = getMockAdminFeedPost(id);
    if (!mock) return null;
    return {
      id: mock.id,
      category: mock.category,
      status: mock.status,
      mediaUrl: mock.mediaUrl,
      translations: mock.translations,
      businessAccountId: mock.businessAccountId,
      businessName: mock.businessName,
      createdAt: mock.createdAt,
      publishedAt: mock.publishedAt,
      rejectionReason: mock.rejectionReason,
    };
  }

  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feed_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  const translations = data.translations as CreateFeedPostInput["translations"];
  let businessName: string | null = null;
  if (data.business_account_id) {
    const { data: business } = await supabase
      .from("business_accounts")
      .select("name")
      .eq("id", data.business_account_id)
      .maybeSingle();
    businessName = business?.name ?? null;
  }

  return {
    id: data.id,
    category: data.category as FeedPostCategory,
    status: data.status,
    mediaUrl: data.media_url,
    translations: {
      en: {
        title: translations?.en?.title ?? "",
        description: translations?.en?.description ?? "",
      },
      ...(translations?.ro
        ? {
            ro: {
              title: translations.ro.title,
              description: translations.ro.description,
            },
          }
        : {}),
    },
    businessAccountId: data.business_account_id,
    businessName,
    createdAt: data.created_at,
    publishedAt: data.published_at,
    rejectionReason: data.rejection_reason,
  };
}
