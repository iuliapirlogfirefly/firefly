import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, shouldUseMockData } from "@/lib/supabase/config";
import { MOCK_BUSINESS_ACCOUNT_ID } from "@/lib/mocks/data";
import type { BusinessBillingInfo, BusinessType } from "@/types";

export type BusinessAccountInfo = {
  id: string;
  type: BusinessType;
  name: string;
  status: string;
  billing: BusinessBillingInfo;
  venue: {
    name: string;
    address: string;
    lat: number;
    lng: number;
  } | null;
};

const emptyBilling: BusinessBillingInfo = {
  legalName: "",
  cui: "",
  billingAddress: "",
  billingCity: "",
  billingCounty: "",
  billingPostalCode: "",
  billingCountry: "RO",
};

function mapBilling(row: {
  legal_name: string | null;
  cui: string | null;
  billing_address: string | null;
  billing_city: string | null;
  billing_county: string | null;
  billing_postal_code: string | null;
  billing_country: string | null;
}): BusinessBillingInfo {
  return {
    legalName: row.legal_name ?? "",
    cui: row.cui ?? "",
    billingAddress: row.billing_address ?? "",
    billingCity: row.billing_city ?? "",
    billingCounty: row.billing_county ?? "",
    billingPostalCode: row.billing_postal_code ?? "",
    billingCountry: row.billing_country ?? "RO",
  };
}

export async function getBusinessAccountInfo(
  businessAccountId: string
): Promise<BusinessAccountInfo | null> {
  if (shouldUseMockData()) {
    return {
      id: MOCK_BUSINESS_ACCOUNT_ID,
      type: "venue",
      name: "Control Club",
      status: "approved",
      billing: {
        legalName: "Control Club SRL",
        cui: "RO12345678",
        billingAddress: "Str. Constantin Mille 4",
        billingCity: "București",
        billingCounty: "București",
        billingPostalCode: "010142",
        billingCountry: "RO",
      },
      venue: {
        name: "Control Club",
        address: "Str. Constantin Mille 4, București",
        lat: 44.4326,
        lng: 26.0999,
      },
    };
  }

  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data: business, error } = await supabase
    .from("business_accounts")
    .select(
      "id, type, name, status, legal_name, cui, billing_address, billing_city, billing_county, billing_postal_code, billing_country"
    )
    .eq("id", businessAccountId)
    .single();

  if (error || !business) return null;

  let venue: BusinessAccountInfo["venue"] = null;
  if (business.type === "venue") {
    const { data: venueRow } = await supabase
      .from("venues")
      .select("name, address, lat, lng")
      .eq("business_account_id", businessAccountId)
      .single();

    if (venueRow) {
      venue = {
        name: venueRow.name,
        address: venueRow.address,
        lat: venueRow.lat,
        lng: venueRow.lng,
      };
    }
  }

  return {
    id: business.id,
    type: business.type as BusinessType,
    name: business.name,
    status: business.status,
    billing: mapBilling(business),
    venue,
  };
}

export type AdminBusinessDetails = {
  id: string;
  name: string;
  type: BusinessType;
  status: string;
  email: string;
  joinedAt: string;
  billing: BusinessBillingInfo;
  subscription: {
    id: string;
    status: string;
    renewsAt: string;
    cancelAtPeriodEnd: boolean;
    promotedUsed: number;
    promotedQuota: number;
    postsUsed: number;
    postsQuota: number;
    newslettersUsed: number;
    newslettersQuota: number;
    socialUsed: number;
    socialQuota: number;
  } | null;
  recentPayments: {
    id: string;
    productType: string;
    amountCents: number;
    currency: string;
    paidAt: string;
  }[];
};

export async function getAdminBusinessDetails(
  businessAccountId: string
): Promise<AdminBusinessDetails | null> {
  if (shouldUseMockData()) {
    return {
      id: businessAccountId,
      name: "Control Club",
      type: "venue",
      status: "approved",
      email: "control@example.com",
      joinedAt: "2026-01-10",
      billing: {
        legalName: "Control Club SRL",
        cui: "RO12345678",
        billingAddress: "Str. Constantin Mille 4",
        billingCity: "București",
        billingCounty: "București",
        billingPostalCode: "010142",
        billingCountry: "RO",
      },
      subscription: {
        id: "sub-1",
        status: "active",
        renewsAt: "2026-04-15",
        cancelAtPeriodEnd: false,
        promotedUsed: 2,
        promotedQuota: 4,
        postsUsed: 1,
        postsQuota: 4,
        newslettersUsed: 1,
        newslettersQuota: 2,
        socialUsed: 0,
        socialQuota: 2,
      },
      recentPayments: [
        {
          id: "pay-1",
          productType: "subscription",
          amountCents: 10000,
          currency: "eur",
          paidAt: "2026-03-15",
        },
      ],
    };
  }

  if (!isSupabaseConfigured()) return null;

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: business, error } = await supabase
    .from("business_accounts")
    .select(
      "id, profile_id, type, name, status, created_at, legal_name, cui, billing_address, billing_city, billing_county, billing_postal_code, billing_country"
    )
    .eq("id", businessAccountId)
    .single();

  if (error || !business) return null;

  const { data: authUser } = await admin.auth.admin.getUserById(
    business.profile_id
  );

  const { data: sub } = await supabase
    .from("subscriptions")
    .select(
      "id, status, current_period_end, cancel_at_period_end, used_promoted_events, quota_promoted_events, used_feed_posts, quota_feed_posts, used_newsletters, quota_newsletters, used_social_posts, quota_social_posts"
    )
    .eq("business_account_id", businessAccountId)
    .eq("status", "active")
    .maybeSingle();

  const { data: payments } = await supabase
    .from("payments")
    .select("id, product_type, amount_cents, currency, paid_at")
    .eq("business_account_id", businessAccountId)
    .eq("status", "paid")
    .order("paid_at", { ascending: false })
    .limit(10);

  return {
    id: business.id,
    name: business.name,
    type: business.type as BusinessType,
    status: business.status,
    email: authUser?.user?.email ?? "—",
    joinedAt: business.created_at?.slice(0, 10) ?? "",
    billing: mapBilling(business),
    subscription: sub
      ? {
          id: sub.id,
          status: sub.status,
          renewsAt: sub.current_period_end?.slice(0, 10) ?? "",
          cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
          promotedUsed: sub.used_promoted_events,
          promotedQuota: sub.quota_promoted_events,
          postsUsed: sub.used_feed_posts,
          postsQuota: sub.quota_feed_posts,
          newslettersUsed: sub.used_newsletters,
          newslettersQuota: sub.quota_newsletters,
          socialUsed: sub.used_social_posts,
          socialQuota: sub.quota_social_posts,
        }
      : null,
    recentPayments: (payments ?? []).map((p) => ({
      id: p.id,
      productType: p.product_type,
      amountCents: p.amount_cents,
      currency: p.currency,
      paidAt: p.paid_at?.slice(0, 10) ?? "",
    })),
  };
}

export { emptyBilling };
