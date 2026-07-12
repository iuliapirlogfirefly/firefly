import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, shouldUseMockData } from "@/lib/supabase/config";
import { MOCK_BUSINESS_ACCOUNT_ID } from "@/lib/mocks/data";
import type { BusinessType } from "@/types";

export type BusinessAccountInfo = {
  id: string;
  type: BusinessType;
  name: string;
  status: string;
  venue: {
    name: string;
    address: string;
    lat: number;
    lng: number;
  } | null;
};

export async function getBusinessAccountInfo(
  businessAccountId: string
): Promise<BusinessAccountInfo | null> {
  if (shouldUseMockData()) {
    return {
      id: MOCK_BUSINESS_ACCOUNT_ID,
      type: "venue",
      name: "Control Club",
      status: "approved",
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
    .select("id, type, name, status")
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
    venue,
  };
}
