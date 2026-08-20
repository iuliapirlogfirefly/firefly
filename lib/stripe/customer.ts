import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/client";
import type { Locale } from "@/types";

type BusinessBillingRow = {
  id: string;
  profile_id: string;
  name: string;
  legal_name: string | null;
  cui: string | null;
  billing_address: string | null;
  billing_city: string | null;
  billing_county: string | null;
  billing_postal_code: string | null;
  billing_country: string | null;
  stripe_customer_id: string | null;
};

export type BusinessBillingContact = {
  email: string | null;
  locale: Locale;
  businessName: string;
};

async function loadBusiness(
  businessAccountId: string
): Promise<BusinessBillingRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("business_accounts")
    .select(
      "id, profile_id, name, legal_name, cui, billing_address, billing_city, billing_county, billing_postal_code, billing_country, stripe_customer_id"
    )
    .eq("id", businessAccountId)
    .maybeSingle();
  return data;
}

export async function getBusinessBillingContact(
  businessAccountId: string
): Promise<BusinessBillingContact | null> {
  const admin = createAdminClient();
  const business = await loadBusiness(businessAccountId);
  if (!business) return null;

  const [{ data: authUser }, { data: profile }] = await Promise.all([
    admin.auth.admin.getUserById(business.profile_id),
    admin
      .from("profiles")
      .select("preferred_locale")
      .eq("id", business.profile_id)
      .maybeSingle(),
  ]);

  return {
    email: authUser.user?.email ?? null,
    locale: (profile?.preferred_locale as Locale) ?? "en",
    businessName: business.name,
  };
}

async function attachRomanianTaxId(customerId: string, cui: string) {
  const value = cui.replace(/^RO/i, "").trim();
  if (!value) return;

  const stripe = getStripe();
  try {
    const existing = await stripe.customers.listTaxIds(customerId, { limit: 10 });
    if (existing.data.some((taxId) => taxId.value === value)) return;

    await stripe.customers.createTaxId(customerId, {
      type: "ro_tin",
      value,
    });
  } catch (error) {
    console.warn("[stripe] Could not attach Romanian tax ID", error);
  }
}

export async function getOrCreateStripeCustomer(params: {
  businessAccountId: string;
  email?: string | null;
}): Promise<string> {
  const admin = createAdminClient();
  const stripe = getStripe();
  const business = await loadBusiness(params.businessAccountId);
  if (!business) {
    throw new Error("Business account not found");
  }

  let customerId = business.stripe_customer_id;

  if (!customerId) {
    const { data: existingSub } = await admin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("business_account_id", params.businessAccountId)
      .maybeSingle();
    customerId = existingSub?.stripe_customer_id ?? null;
  }

  const email = params.email ?? (await getBusinessBillingContact(params.businessAccountId))?.email ?? undefined;
  const name = business.legal_name?.trim() || business.name;
  const address = business.billing_address
    ? {
        line1: business.billing_address,
        city: business.billing_city ?? undefined,
        state: business.billing_county ?? undefined,
        postal_code: business.billing_postal_code ?? undefined,
        country: business.billing_country || "RO",
      }
    : undefined;

  if (customerId) {
    await stripe.customers.update(customerId, {
      ...(email ? { email } : {}),
      name,
      ...(address ? { address } : {}),
      metadata: { business_account_id: params.businessAccountId },
    });
  } else {
    const customer = await stripe.customers.create({
      ...(email ? { email } : {}),
      name,
      ...(address ? { address } : {}),
      metadata: { business_account_id: params.businessAccountId },
    });
    customerId = customer.id;
  }

  if (business.stripe_customer_id !== customerId) {
    await admin
      .from("business_accounts")
      .update({
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.businessAccountId);
  }

  if (business.cui) {
    await attachRomanianTaxId(customerId, business.cui);
  }

  return customerId;
}
