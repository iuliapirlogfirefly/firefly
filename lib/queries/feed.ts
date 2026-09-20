import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, shouldUseMockData } from "@/lib/supabase/config";
import { getLocalizedField } from "@/lib/i18n/content";
import type { Locale, FeedPostCategory } from "@/types";
import type { CreateFeedPostInput } from "@/types/events";
import {
  getMockAdminFeedPost,
  getMockAllAdminFeedPosts,
  getMockFeedPosts,
  getMockPendingFeedPosts,
} from "@/lib/mocks/data";
import { filterMissedPosts } from "@/lib/utils/feed-filters";
import {
  emptyPage,
  ilikeContains,
  paginateItems,
  rangeForPage,
  toPaginated,
  type Paginated,
} from "@/lib/admin/pagination";

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

export type AdminFeedPostListItem = {
  id: string;
  category: FeedPostCategory;
  title: string;
  description: string;
  mediaUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  status: string;
  rejectionReason: string | null;
  businessName: string | null;
};

type FeedPostRow = {
  id: string;
  category: string;
  translations: unknown;
  media_url: string | null;
  published_at: string | null;
  created_at: string;
  status: string;
  rejection_reason: string | null;
  business_account_id: string | null;
};

function mapAdminFeedPostListItem(
  post: FeedPostRow,
  locale: Locale,
  businessNameById: Map<string, string>
): AdminFeedPostListItem {
  return {
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
    publishedAt: post.published_at,
    createdAt: post.created_at,
    status: post.status,
    rejectionReason: post.rejection_reason,
    businessName: post.business_account_id
      ? (businessNameById.get(post.business_account_id) ?? null)
      : null,
  };
}

async function getBusinessNameById(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: { business_account_id: string | null }[]
) {
  const businessIds = [
    ...new Set(
      rows
        .map((post) => post.business_account_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];
  const businessNameById = new Map<string, string>();
  if (businessIds.length === 0) return businessNameById;

  const { data: businesses } = await supabase
    .from("business_accounts")
    .select("id, name")
    .in("id", businessIds);

  for (const business of businesses ?? []) {
    businessNameById.set(business.id, business.name);
  }

  return businessNameById;
}

export async function getPendingFeedPostCount(): Promise<number> {
  if (shouldUseMockData()) return getMockPendingFeedPosts("en").length;
  if (!isSupabaseConfigured()) return 0;

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("feed_posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  if (error) throw error;
  return count ?? 0;
}

export async function getPendingFeedPosts(
  locale: Locale,
  page = 1
): Promise<Paginated<AdminFeedPostListItem>> {
  if (shouldUseMockData()) {
    return paginateItems(getMockPendingFeedPosts(locale), page);
  }

  if (!isSupabaseConfigured()) return emptyPage(page);

  const { from, to, pageSize, page: safePage } = rangeForPage(page);
  const supabase = await createClient();
  const { data, error, count } = await supabase
    .from("feed_posts")
    .select("*", { count: "exact" })
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .range(from, to);

  if (error) throw error;

  const rows = data ?? [];
  const businessNameById = await getBusinessNameById(supabase, rows);
  return toPaginated(
    rows.map((post) =>
      mapAdminFeedPostListItem(post, locale, businessNameById)
    ),
    count ?? 0,
    safePage,
    pageSize
  );
}

export async function getAllAdminFeedPosts(
  locale: Locale,
  options: { page?: number; q?: string; status?: string } = {}
): Promise<Paginated<AdminFeedPostListItem>> {
  const page = options.page ?? 1;
  const status =
    options.status && options.status !== "all" ? options.status : "";
  const pattern = options.q ? ilikeContains(options.q) : null;

  if (shouldUseMockData()) {
    const filtered = getMockAllAdminFeedPosts(locale).filter((post) => {
      const matchesStatus = !status || post.status === status;
      const haystack = `${post.title} ${post.businessName ?? ""}`.toLowerCase();
      const matchesSearch =
        !options.q || haystack.includes(options.q.toLowerCase());
      return matchesStatus && matchesSearch;
    });
    return paginateItems(filtered, page);
  }

  if (!isSupabaseConfigured()) return emptyPage(page);

  const { from, to, pageSize, page: safePage } = rangeForPage(page);
  const supabase = await createClient();

  let query = supabase
    .from("feed_posts")
    .select("*", { count: "exact" })
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  if (pattern) {
    const { data: businesses } = await supabase
      .from("business_accounts")
      .select("id")
      .ilike("name", pattern);
    const businessIds = (businesses ?? []).map((business) => business.id);
    const filters = [`translations.ilike.${pattern}`];
    if (businessIds.length > 0) {
      filters.push(`business_account_id.in.(${businessIds.join(",")})`);
    }
    query = query.or(filters.join(","));
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  const rows = data ?? [];
  const businessNameById = await getBusinessNameById(supabase, rows);
  return toPaginated(
    rows.map((post) =>
      mapAdminFeedPostListItem(post, locale, businessNameById)
    ),
    count ?? 0,
    safePage,
    pageSize
  );
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
