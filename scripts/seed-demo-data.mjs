/**
 * Seed the Firefly Supabase project with realistic demo data — users, business
 * accounts, venues, events (every status/genre/type), feed posts, promotions,
 * a subscription, payments, saves, reminders, and analytics events — so there's
 * enough in the app to walk a client through every screen.
 *
 * Usage:
 *   npm run db:seed-demo
 *
 * Loads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local
 * or .env.vercel, same as scripts/create-admin-user.mjs. Safe to run more than
 * once — users/business accounts/venues/events are upserted by a stable key,
 * and the "volatile" tables (posts, promotions, subscriptions, payments,
 * saves, reminders, analytics) are only seeded the first time (skipped if
 * Control Club already has payment rows).
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnvFile(filename) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env.vercel");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PASSWORD = process.env.DEMO_PASSWORD ?? "FireflyDemo2026!";

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local / .env.vercel"
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const IMG = {
  crowd: "/images/editorial-crowd.png",
  dj: "/images/editorial-dj.png",
  street: "/images/editorial-street.png",
  friends: "/images/editorial-friends.png",
  sign: "/images/editorial-sign.png",
  event1: "/images/event-1.png",
  event2: "/images/event-2.png",
  event3: "/images/event-3.png",
  event4: "/images/event-4.png",
};
const IMG_CYCLE = Object.values(IMG);

function todayPlus(days, hour = 22, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

async function findUserIdByEmail(email) {
  // admin.auth.admin.listUsers() errors with a generic "Database error
  // finding users" on some projects, so avoid it entirely. generateLink with
  // type "recovery" requires an *existing* user (it errors if there isn't
  // one) and returns that user's record — a reliable email -> id lookup that
  // doesn't actually send anything, since we never use the generated link.
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
  });

  if (error) return null; // most likely "user not found" — treat as not existing
  return data?.user?.id ?? null;
}

async function getOrCreateUser({ email, displayName, locale = "en" }) {
  let userId = await findUserIdByEmail(email);

  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: displayName },
    });

    if (error) {
      // Safety net: if Supabase says the email is already registered but our
      // lookup missed it, look it up again before giving up.
      if (/already.*registered/i.test(error.message)) {
        userId = await findUserIdByEmail(email);
      }
      if (!userId) {
        throw new Error(`createUser(${email}): ${error.message}`);
      }
    } else {
      userId = data.user.id;
    }
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      display_name: displayName,
      preferred_locale: locale,
      newsletter_opt_in: Math.random() > 0.4,
    })
    .eq("id", userId);
  if (profileError) throw new Error(`profile update(${email}): ${profileError.message}`);

  return userId;
}

async function createBusiness({
  email,
  displayName,
  type,
  businessName,
  status,
  rejectionReason,
  venue,
}) {
  const profileId = await getOrCreateUser({ email, displayName });

  const role = type === "venue" ? "business_venue" : "business_organizer";
  await admin.from("profiles").update({ role }).eq("id", profileId);

  const { data: business, error } = await admin
    .from("business_accounts")
    .upsert(
      {
        profile_id: profileId,
        type,
        name: businessName,
        status,
        rejection_reason: rejectionReason ?? null,
        approved_at: status === "approved" ? new Date().toISOString() : null,
      },
      { onConflict: "profile_id" }
    )
    .select("id")
    .single();
  if (error) throw new Error(`business_accounts(${businessName}): ${error.message}`);

  let venueId = null;
  if (venue) {
    const { data: venueRow, error: venueError } = await admin
      .from("venues")
      .upsert(
        {
          business_account_id: business.id,
          name: venue.name,
          address: venue.address,
          lat: venue.lat,
          lng: venue.lng,
        },
        { onConflict: "business_account_id" }
      )
      .select("id")
      .single();
    if (venueError) throw new Error(`venues(${businessName}): ${venueError.message}`);
    venueId = venueRow.id;
  }

  return { profileId, businessId: business.id, venueId };
}

async function upsertEvent(row) {
  const { error } = await admin.from("events").upsert(row, { onConflict: "slug" });
  if (error) throw new Error(`events(${row.slug}): ${error.message}`);
  const { data } = await admin.from("events").select("id").eq("slug", row.slug).single();
  return data.id;
}

async function main() {
  console.log("1/9 · Creating admin user...");
  const adminEmail = "admin@firefly.app";
  const existingAdminId = await getOrCreateUser({
    email: adminEmail,
    displayName: "Firefly Admin",
  });
  await admin.from("profiles").update({ role: "admin" }).eq("id", existingAdminId);

  console.log("2/9 · Creating regular users...");
  const users = await Promise.all([
    getOrCreateUser({ email: "ana.popescu@demo.firefly.app", displayName: "Ana Popescu" }),
    getOrCreateUser({ email: "mihai.ionescu@demo.firefly.app", displayName: "Mihai Ionescu" }),
    getOrCreateUser({ email: "elena.dumitru@demo.firefly.app", displayName: "Elena Dumitru" }),
    getOrCreateUser({ email: "andrei.stan@demo.firefly.app", displayName: "Andrei Stan" }),
    getOrCreateUser({ email: "cristina.marin@demo.firefly.app", displayName: "Cristina Marin" }),
  ]);
  const [anaId, mihaiId, elenaId, andreiId, cristinaId] = users;

  // Suspend one regular user to demo the suspension feature.
  await admin
    .from("profiles")
    .update({ is_suspended: true, suspended_at: new Date().toISOString() })
    .eq("id", andreiId);

  console.log("3/9 · Creating business accounts + venues...");
  const controlClub = await createBusiness({
    email: "control-club@demo.firefly.app",
    displayName: "Control Club",
    type: "venue",
    businessName: "Control Club",
    status: "approved",
    venue: {
      name: "Control Club",
      address: "Strada Academiei 19, București",
      lat: 44.4378,
      lng: 26.0966,
    },
  });

  const kulturhaus = await createBusiness({
    email: "kulturhaus@demo.firefly.app",
    displayName: "Kulturhaus",
    type: "venue",
    businessName: "Kulturhaus",
    status: "approved",
    venue: {
      name: "Kulturhaus",
      address: "Strada Blănari 21, București",
      lat: 44.4268,
      lng: 26.1025,
    },
  });

  const skyLounge = await createBusiness({
    email: "sky-lounge@demo.firefly.app",
    displayName: "Sky Lounge",
    type: "venue",
    businessName: "Sky Lounge",
    status: "approved",
    venue: {
      name: "Sky Lounge",
      address: "Calea Victoriei 155, București",
      lat: 44.4412,
      lng: 26.0898,
    },
  });

  const subterra = await createBusiness({
    email: "subterra@demo.firefly.app",
    displayName: "Subterra",
    type: "venue",
    businessName: "Subterra",
    status: "pending",
    venue: {
      name: "Subterra",
      address: "Strada Covaci 4, București",
      lat: 44.4304,
      lng: 26.1015,
    },
  });

  const greenHours = await createBusiness({
    email: "green-hours@demo.firefly.app",
    displayName: "Green Hours",
    type: "venue",
    businessName: "Green Hours",
    status: "suspended",
    venue: {
      name: "Green Hours",
      address: "Calea Victoriei 120, București",
      lat: 44.4396,
      lng: 26.0963,
    },
  });

  const nightCollective = await createBusiness({
    email: "night-collective@demo.firefly.app",
    displayName: "Night Collective",
    type: "organizer",
    businessName: "Night Collective",
    status: "approved",
  });

  const bassTherapy = await createBusiness({
    email: "bass-therapy@demo.firefly.app",
    displayName: "Bass Therapy Events",
    type: "organizer",
    businessName: "Bass Therapy Events",
    status: "rejected",
    rejectionReason: "Missing business registration documents.",
  });

  console.log("4/9 · Creating events...");

  const tr = (enTitle, enDesc, roTitle, roDesc) => ({
    en: { title: enTitle, description: enDesc },
    ro: { title: roTitle, description: roDesc },
  });

  let imgIndex = 0;
  const nextImg = () => IMG_CYCLE[imgIndex++ % IMG_CYCLE.length];

  const eventDefs = [
    // Control Club (venue, approved)
    {
      slug: "control-club-techno-tonight",
      status: "published", source: "business", business_account_id: controlClub.businessId, venue_id: controlClub.venueId,
      starts_at: todayPlus(0, 23, 0), ends_at: todayPlus(1, 6, 0),
      genre: "techno", event_type: "club_night", price: 60, ticket_url: "https://example.com/tickets/cc-techno",
      cover_image_url: nextImg(), is_promoted: true, promotion_intensity: 3,
      translations: tr("Techno Tonight", "Underground techno all night long.", "Techno Diseară", "Techno underground toată noaptea."),
      venue_name: "Control Club", address: "Strada Academiei 19, București", lat: 44.4378, lng: 26.0966,
    },
    {
      slug: "control-club-minimal-sessions",
      status: "published", source: "business", business_account_id: controlClub.businessId, venue_id: controlClub.venueId,
      starts_at: todayPlus(6, 23, 30), ends_at: todayPlus(7, 6, 0),
      genre: "minimal", event_type: "club_night", price: 50, ticket_url: "https://example.com/tickets/cc-minimal",
      cover_image_url: nextImg(), is_promoted: false, promotion_intensity: 1,
      translations: tr("Minimal Sessions", "A stripped-back night of minimal techno.", "Sesiuni Minimal", "O noapte de minimal techno."),
      venue_name: "Control Club", address: "Strada Academiei 19, București", lat: 44.4378, lng: 26.0966,
    },
    {
      slug: "control-club-open-format-friday",
      status: "published", source: "business", business_account_id: controlClub.businessId, venue_id: controlClub.venueId,
      starts_at: todayPlus(13, 22, 0), ends_at: todayPlus(14, 5, 0),
      genre: "open_format", event_type: "party", price: 40, ticket_url: "https://example.com/tickets/cc-open",
      cover_image_url: nextImg(), is_promoted: true, promotion_intensity: 2,
      translations: tr("Open Format Friday", "Anything goes — resident DJs mixing every genre.", "Vineri Open Format", "Orice se poate întâmpla — DJ rezidenți mixând orice gen."),
      venue_name: "Control Club", address: "Strada Academiei 19, București", lat: 44.4378, lng: 26.0966,
    },
    {
      slug: "control-club-warehouse-preview",
      status: "pending", source: "business", business_account_id: controlClub.businessId, venue_id: controlClub.venueId,
      starts_at: todayPlus(20, 23, 0), ends_at: todayPlus(21, 6, 0),
      genre: "techno", event_type: "club_night", price: 70, ticket_url: "https://example.com/tickets/cc-warehouse",
      cover_image_url: nextImg(), is_promoted: false, promotion_intensity: 1,
      translations: tr("Warehouse Preview", "A special guest lineup announced soon.", "Warehouse Preview", "Un lineup special va fi anunțat curând."),
      venue_name: "Control Club", address: "Strada Academiei 19, București", lat: 44.4378, lng: 26.0966,
    },

    // Kulturhaus (venue, approved)
    {
      slug: "kulturhaus-house-garden",
      status: "published", source: "business", business_account_id: kulturhaus.businessId, venue_id: kulturhaus.venueId,
      starts_at: todayPlus(2, 22, 0), ends_at: todayPlus(3, 4, 0),
      genre: "house", event_type: "party", price: 40, ticket_url: "https://example.com/tickets/kh-house",
      cover_image_url: nextImg(), is_promoted: false, promotion_intensity: 1,
      translations: tr("House Garden Party", "Open air house music experience.", "Petrecere House în Grădină", "Experiență house music în aer liber."),
      venue_name: "Kulturhaus", address: "Strada Blănari 21, București", lat: 44.4268, lng: 26.1025,
    },
    {
      slug: "kulturhaus-commercial-hits",
      status: "published", source: "business", business_account_id: kulturhaus.businessId, venue_id: kulturhaus.venueId,
      starts_at: todayPlus(9, 22, 0), ends_at: todayPlus(10, 5, 0),
      genre: "commercial", event_type: "party", price: 35, ticket_url: "https://example.com/tickets/kh-hits",
      cover_image_url: nextImg(), is_promoted: false, promotion_intensity: 1,
      translations: tr("Commercial Hits Night", "All the songs you know, all night.", "Noaptea Hiturilor", "Toate piesele pe care le știi, toată noaptea."),
      venue_name: "Kulturhaus", address: "Strada Blănari 21, București", lat: 44.4268, lng: 26.1025,
    },
    {
      slug: "kulturhaus-brunch-session",
      status: "draft", source: "business", business_account_id: kulturhaus.businessId, venue_id: kulturhaus.venueId,
      starts_at: todayPlus(16, 12, 0), ends_at: todayPlus(16, 18, 0),
      genre: "pop", event_type: "brunch_day_party", price: 30, ticket_url: "",
      cover_image_url: nextImg(), is_promoted: false, promotion_intensity: 1,
      translations: tr("Sunday Brunch Session", "Daytime brunch party — still finalizing lineup.", "Brunch de Duminică", "Petrecere de zi — lineup în curs de finalizare."),
      venue_name: "Kulturhaus", address: "Strada Blănari 21, București", lat: 44.4268, lng: 26.1025,
    },

    // Sky Lounge (venue, approved)
    {
      slug: "sky-lounge-afro-house-sunset",
      status: "published", source: "business", business_account_id: skyLounge.businessId, venue_id: skyLounge.venueId,
      starts_at: todayPlus(4, 19, 0), ends_at: todayPlus(5, 1, 0),
      genre: "afro_house", event_type: "rooftop", price: 60, ticket_url: "https://example.com/tickets/sl-afro",
      cover_image_url: nextImg(), is_promoted: true, promotion_intensity: 2,
      translations: tr("Afro House Rooftop Sunset", "Sunset session with afro house vibes.", "Afro House Rooftop Apus", "Sesiune la apus cu vibe-uri afro house."),
      venue_name: "Sky Lounge", address: "Calea Victoriei 155, București", lat: 44.4412, lng: 26.0898,
    },
    {
      slug: "sky-lounge-latin-terrace",
      status: "published", source: "business", business_account_id: skyLounge.businessId, venue_id: skyLounge.venueId,
      starts_at: todayPlus(11, 20, 0), ends_at: todayPlus(12, 2, 0),
      genre: "latin", event_type: "rooftop", price: 45, ticket_url: "https://example.com/tickets/sl-latin",
      cover_image_url: nextImg(), is_promoted: false, promotion_intensity: 1,
      translations: tr("Latin Terrace Nights", "Salsa, reggaeton and rooftop views.", "Nopți Latine pe Terasă", "Salsa, reggaeton și priveliște de pe terasă."),
      venue_name: "Sky Lounge", address: "Calea Victoriei 155, București", lat: 44.4412, lng: 26.0898,
    },
    {
      slug: "sky-lounge-summer-closing-2025",
      status: "archived", source: "business", business_account_id: skyLounge.businessId, venue_id: skyLounge.venueId,
      starts_at: todayPlus(-10, 20, 0), ends_at: todayPlus(-9, 2, 0),
      genre: "house", event_type: "rooftop", price: 55, ticket_url: "https://example.com/tickets/sl-closing",
      cover_image_url: nextImg(), is_promoted: false, promotion_intensity: 1,
      translations: tr("Summer Closing Party", "Season closing party — archived after the date passed.", "Petrecere de Închidere", "Petrecere de închidere a sezonului — arhivată."),
      venue_name: "Sky Lounge", address: "Calea Victoriei 155, București", lat: 44.4412, lng: 26.0898,
    },

    // Subterra (venue, pending business — events awaiting business approval)
    {
      slug: "subterra-industrial-techno",
      status: "pending", source: "business", business_account_id: subterra.businessId, venue_id: subterra.venueId,
      starts_at: todayPlus(15, 23, 0), ends_at: todayPlus(16, 6, 0),
      genre: "techno", event_type: "club_night", price: 45, ticket_url: "https://example.com/tickets/sub-industrial",
      cover_image_url: nextImg(), is_promoted: false, promotion_intensity: 1,
      translations: tr("Industrial Techno Night", "Raw industrial techno in a basement setting.", "Noapte Techno Industrial", "Techno industrial într-un decor de subsol."),
      venue_name: "Subterra", address: "Strada Covaci 4, București", lat: 44.4304, lng: 26.1015,
    },
    {
      slug: "subterra-live-performance-showcase",
      status: "pending", source: "business", business_account_id: subterra.businessId, venue_id: subterra.venueId,
      starts_at: todayPlus(22, 21, 0), ends_at: todayPlus(23, 2, 0),
      genre: "live_music", event_type: "live_performance", price: 50, ticket_url: "https://example.com/tickets/sub-live",
      cover_image_url: nextImg(), is_promoted: false, promotion_intensity: 1,
      translations: tr("Live Performance Showcase", "Local live acts across genres.", "Spectacol Live", "Artiști locali din mai multe genuri."),
      venue_name: "Subterra", address: "Strada Covaci 4, București", lat: 44.4304, lng: 26.1015,
    },

    // Green Hours (venue, suspended — event created before suspension, stays live)
    {
      slug: "green-hours-jazz-evening",
      status: "published", source: "business", business_account_id: greenHours.businessId, venue_id: greenHours.venueId,
      starts_at: todayPlus(8, 20, 0), ends_at: todayPlus(9, 0, 0),
      genre: "jazz", event_type: "live_performance", price: 30, ticket_url: "https://example.com/tickets/gh-jazz",
      cover_image_url: nextImg(), is_promoted: false, promotion_intensity: 1,
      translations: tr("Jazz Evening", "An intimate jazz evening.", "Seară de Jazz", "O seară intimă de jazz."),
      venue_name: "Green Hours", address: "Calea Victoriei 120, București", lat: 44.4396, lng: 26.0963,
    },

    // Night Collective (organizer, approved — different venue each event)
    {
      slug: "night-collective-hiphop-block-party",
      status: "published", source: "business", business_account_id: nightCollective.businessId, venue_id: null,
      starts_at: todayPlus(3, 21, 0), ends_at: todayPlus(4, 3, 0),
      genre: "hip_hop_rnb", event_type: "social_gathering", price: 25, ticket_url: "https://example.com/tickets/nc-hiphop",
      cover_image_url: nextImg(), is_promoted: true, promotion_intensity: 2,
      translations: tr("Hip-Hop Block Party", "Old school and new school, back to back.", "Block Party Hip-Hop", "Old school și new school, unul după altul."),
      venue_name: "Fabrica de Sticle", address: "Șos. Grozăvești 7, București", lat: 44.4444, lng: 26.0575,
    },
    {
      slug: "night-collective-edm-festival-preview",
      status: "published", source: "business", business_account_id: nightCollective.businessId, venue_id: null,
      starts_at: todayPlus(18, 20, 0), ends_at: todayPlus(19, 4, 0),
      genre: "edm", event_type: "festival", price: 90, ticket_url: "https://example.com/tickets/nc-edm",
      cover_image_url: nextImg(), is_promoted: true, promotion_intensity: 3,
      translations: tr("EDM Festival Preview", "A taste of the main festival stage.", "Preview Festival EDM", "Un gust din scena principală a festivalului."),
      venue_name: "Arenele Romane", address: "Aleea Verde 3, București", lat: 44.4362, lng: 26.0678,
    },
    {
      slug: "night-collective-private-launch",
      status: "pending", source: "business", business_account_id: nightCollective.businessId, venue_id: null,
      starts_at: todayPlus(25, 19, 0), ends_at: todayPlus(25, 23, 0),
      genre: "pop", event_type: "private_event", price: null, ticket_url: "",
      cover_image_url: nextImg(), is_promoted: false, promotion_intensity: 1,
      translations: tr("Brand Launch Night", "Invite-only launch event.", "Seară de Lansare", "Eveniment doar pe bază de invitație."),
      venue_name: "Yolo Terrace", address: "Bd. Unirii 10, București", lat: 44.4275, lng: 26.1080,
    },

    // Bass Therapy Events (organizer, rejected)
    {
      slug: "bass-therapy-dnb-warehouse",
      status: "rejected", source: "business", business_account_id: bassTherapy.businessId, venue_id: null,
      starts_at: todayPlus(17, 22, 0), ends_at: todayPlus(18, 5, 0),
      genre: "edm", event_type: "party", price: 40, ticket_url: "https://example.com/tickets/bt-dnb",
      cover_image_url: nextImg(), is_promoted: false, promotion_intensity: 1,
      rejection_reason: "Venue details could not be verified.",
      translations: tr("D&B Warehouse Session", "Drum & bass in an undisclosed warehouse.", "Sesiune D&B", "Drum & bass într-un depozit secret."),
      venue_name: "TBA Warehouse", address: "Șos. Vitan-Bârzești 7, București", lat: 44.4013, lng: 26.1370,
    },

    // Admin-added (manual, 30% per spec)
    {
      slug: "admin-jazz-night-la-scena",
      status: "published", source: "admin", business_account_id: null, venue_id: null,
      starts_at: todayPlus(5, 20, 0), ends_at: todayPlus(6, 0, 30),
      genre: "jazz", event_type: "live_performance", price: 35, ticket_url: "https://example.com/tickets/admin-jazz",
      cover_image_url: nextImg(), is_promoted: false, promotion_intensity: 1,
      translations: tr("Jazz Night at La Scena", "Curated jazz lineup, admin pick of the week.", "Noapte de Jazz la La Scena", "Lineup de jazz curatoriat, alegerea săptămânii."),
      venue_name: "La Scena", address: "Strada Constantin Mille 4, București", lat: 44.4326, lng: 26.0999,
    },
    {
      slug: "admin-latin-fiesta-terasa-verde",
      status: "published", source: "admin", business_account_id: null, venue_id: null,
      starts_at: todayPlus(10, 21, 0), ends_at: todayPlus(11, 3, 0),
      genre: "latin", event_type: "social_gathering", price: 30, ticket_url: "https://example.com/tickets/admin-latin",
      cover_image_url: nextImg(), is_promoted: false, promotion_intensity: 1,
      translations: tr("Latin Fiesta at Terasa Verde", "Community-submitted, added by the Firefly team.", "Fiesta Latino la Terasa Verde", "Trimis de comunitate, adăugat de echipa Firefly."),
      venue_name: "Terasa Verde", address: "Strada Verde 12, București", lat: 44.4507, lng: 26.0932,
    },
    {
      slug: "admin-open-format-rejected-example",
      status: "rejected", source: "admin", business_account_id: null, venue_id: null,
      starts_at: todayPlus(12, 22, 0), ends_at: todayPlus(13, 4, 0),
      genre: "open_format", event_type: "party", price: 20, ticket_url: "",
      cover_image_url: nextImg(), is_promoted: false, promotion_intensity: 1,
      rejection_reason: "Duplicate submission — already listed by the venue directly.",
      translations: tr("Open Format Night (duplicate example)", "Kept as an example of a rejected admin submission.", "Noapte Open Format (exemplu duplicat)", "Păstrat ca exemplu de trimitere respinsă."),
      venue_name: "Kulturhaus", address: "Strada Blănari 21, București", lat: 44.4268, lng: 26.1025,
    },
  ];

  const eventIds = {};
  for (const def of eventDefs) {
    eventIds[def.slug] = await upsertEvent(def);
  }
  console.log(`   ${eventDefs.length} events upserted.`);

  console.log("5/9 · Checking whether volatile demo data already exists...");
  const { count: existingPayments } = await admin
    .from("payments")
    .select("*", { count: "exact", head: true })
    .eq("business_account_id", controlClub.businessId);

  if (existingPayments && existingPayments > 0) {
    console.log(
      "   Payments already exist for Control Club — skipping posts/promotions/subscriptions/payments/saves/reminders/analytics so we don't duplicate them."
    );
  } else {
    console.log("6/9 · Creating feed posts (\"What did you miss?\")...");
    const feedPostDefs = [
      {
        business_account_id: controlClub.businessId, category: "party_updates", status: "published",
        published_at: todayPlus(-1, 12, 0),
        translations: tr("Control Club sold out for Friday", "Grab the last tables before they're gone.", "Control Club sold out vineri", "Prinde ultimele mese cât mai sunt."),
        media_url: IMG.event1,
      },
      {
        business_account_id: kulturhaus.businessId, category: "party_updates", status: "published",
        published_at: todayPlus(-2, 15, 0),
        translations: tr("Lineup change at Kulturhaus", "A surprise guest joins Friday's lineup.", "Schimbare de lineup la Kulturhaus", "Un invitat surpriză se alătură lineup-ului de vineri."),
        media_url: IMG.event2,
      },
      {
        business_account_id: null, category: "party_updates", status: "published",
        published_at: todayPlus(-3, 18, 0),
        translations: tr("Sky Lounge already crowded tonight", "Rooftop is filling up fast — get there early.", "Sky Lounge deja aglomerat diseară", "Terasa se umple repede — ajungi devreme."),
        media_url: IMG.event3,
      },
      {
        business_account_id: null, category: "nightlife_news", status: "published",
        published_at: todayPlus(-1, 9, 0),
        translations: tr("New resident DJ announced at Control Club", "A fresh name joins the weekly residency.", "Noul DJ rezident la Control Club", "Un nume nou se alătură rezidenței săptămânale."),
        media_url: IMG.dj,
      },
      {
        business_account_id: null, category: "nightlife_news", status: "published",
        published_at: todayPlus(-4, 11, 0),
        translations: tr("Green Hours announces acoustic Sundays", "A new weekly concept launching next month.", "Green Hours anunță Duminici acustice", "Un concept nou, lunar, lansat luna viitoare."),
        media_url: IMG.friends,
      },
      {
        business_account_id: null, category: "nightlife_news", status: "published",
        published_at: todayPlus(-6, 10, 0),
        translations: tr("Bucharest nightlife trending: Afro House", "More venues are booking afro house sets this month.", "Trend în viața de noapte: Afro House", "Tot mai multe cluburi programează seturi afro house luna asta."),
        media_url: IMG.street,
      },
      {
        business_account_id: null, category: "nightlife_chaos", status: "published",
        published_at: todayPlus(-2, 20, 0),
        translations: tr("Poll: best queue story of the month?", "Vote for the wildest door story you've heard.", "Sondaj: cea mai tare poveste de la coadă?", "Votează cea mai nebună poveste de la intrare."),
        media_url: IMG.sign,
      },
      {
        business_account_id: null, category: "nightlife_chaos", status: "published",
        published_at: todayPlus(-5, 22, 0),
        translations: tr("Hot take: door policy edition", "Crowd reactions to this week's door policy debates.", "Părere fierbinte: politica la intrare", "Reacțiile publicului la dezbaterile despre accesul la intrare."),
        media_url: IMG.crowd,
      },
      {
        business_account_id: controlClub.businessId, category: "club_moments", status: "pending",
        published_at: null,
        translations: tr("Last Friday at Control Club", "Photo recap submitted for approval.", "Vinerea trecută la Control Club", "Recap foto trimis spre aprobare."),
        media_url: IMG.event4,
      },
      {
        business_account_id: nightCollective.businessId, category: "club_moments", status: "rejected",
        published_at: null,
        rejection_reason: "Media quality too low for the public feed.",
        translations: tr("Block Party highlights", "Submitted highlights reel — rejected for quality.", "Highlights de la Block Party", "Recap trimis — respins din cauza calității."),
        media_url: IMG.event2,
      },
    ];
    const feedPostIds = [];
    for (const post of feedPostDefs) {
      const { data, error } = await admin.from("feed_posts").insert(post).select("id").single();
      if (error) throw new Error(`feed_posts: ${error.message}`);
      feedPostIds.push(data.id);
    }
    console.log(`   ${feedPostIds.length} feed posts created.`);

    console.log("7/9 · Creating promotions, subscription, and payments...");

    const promotionDefs = [
      { business_account_id: controlClub.businessId, type: "event_boost", target_id: eventIds["control-club-techno-tonight"], expires_at: todayPlus(7) },
      { business_account_id: skyLounge.businessId, type: "event_boost", target_id: eventIds["sky-lounge-afro-house-sunset"], expires_at: todayPlus(4) },
      { business_account_id: nightCollective.businessId, type: "event_boost", target_id: eventIds["night-collective-edm-festival-preview"], expires_at: todayPlus(11) },
      { business_account_id: controlClub.businessId, type: "feed_post", target_id: feedPostIds[0], expires_at: todayPlus(3) },
      { business_account_id: kulturhaus.businessId, type: "newsletter", target_id: eventIds["kulturhaus-house-garden"], expires_at: todayPlus(2) },
      { business_account_id: skyLounge.businessId, type: "social_media", target_id: eventIds["sky-lounge-latin-terrace"], expires_at: todayPlus(6) },
    ];
    for (const promo of promotionDefs) {
      const { error } = await admin.from("promotions").insert({ ...promo, is_active: true, stripe_payment_id: `pi_demo_${Math.random().toString(36).slice(2, 10)}` });
      if (error) throw new Error(`promotions: ${error.message}`);
    }
    console.log(`   ${promotionDefs.length} promotions created.`);

    const { error: subError } = await admin.from("subscriptions").upsert(
      {
        business_account_id: controlClub.businessId,
        stripe_subscription_id: "sub_demo_control_club",
        stripe_customer_id: "cus_demo_control_club",
        status: "active",
        current_period_start: todayPlus(-15),
        current_period_end: todayPlus(15),
        quota_promoted_events: 4,
        quota_feed_posts: 4,
        quota_newsletters: 2,
        quota_social_posts: 2,
        used_promoted_events: 2,
        used_feed_posts: 1,
        used_newsletters: 0,
        used_social_posts: 1,
      },
      { onConflict: "business_account_id" }
    );
    if (subError) throw new Error(`subscriptions: ${subError.message}`);
    console.log("   1 active subscription created (Control Club).");

    const paymentDefs = [
      { business_account_id: controlClub.businessId, type: "one_time", product_type: "event_boost", amount_cents: 3000, days_ago: 2 },
      { business_account_id: skyLounge.businessId, type: "one_time", product_type: "event_boost", amount_cents: 3000, days_ago: 5 },
      { business_account_id: nightCollective.businessId, type: "one_time", product_type: "event_boost", amount_cents: 3000, days_ago: 9 },
      { business_account_id: controlClub.businessId, type: "one_time", product_type: "feed_post", amount_cents: 2000, days_ago: 12 },
      { business_account_id: kulturhaus.businessId, type: "one_time", product_type: "newsletter", amount_cents: 3000, days_ago: 16 },
      { business_account_id: skyLounge.businessId, type: "one_time", product_type: "social_media", amount_cents: 3000, days_ago: 20 },
      { business_account_id: controlClub.businessId, type: "subscription", product_type: "subscription", amount_cents: 10000, days_ago: 15 },
      { business_account_id: controlClub.businessId, type: "subscription", product_type: "subscription", amount_cents: 10000, days_ago: 45 },
      { business_account_id: nightCollective.businessId, type: "one_time", product_type: "event_boost", amount_cents: 3000, days_ago: 25 },
      { business_account_id: kulturhaus.businessId, type: "one_time", product_type: "feed_post", amount_cents: 2000, days_ago: 30 },
    ];
    for (const payment of paymentDefs) {
      const paidAt = new Date();
      paidAt.setDate(paidAt.getDate() - payment.days_ago);
      const { error } = await admin.from("payments").insert({
        business_account_id: payment.business_account_id,
        stripe_payment_intent_id: `pi_demo_${Math.random().toString(36).slice(2, 12)}`,
        type: payment.type,
        product_type: payment.product_type,
        amount_cents: payment.amount_cents,
        currency: "eur",
        status: "paid",
        paid_at: paidAt.toISOString(),
      });
      if (error) throw new Error(`payments: ${error.message}`);
    }
    console.log(`   ${paymentDefs.length} payments created.`);

    console.log("8/9 · Creating saves + reminders...");
    const savesDefs = [
      { user_id: anaId, event_id: eventIds["control-club-techno-tonight"] },
      { user_id: anaId, event_id: eventIds["sky-lounge-afro-house-sunset"] },
      { user_id: mihaiId, event_id: eventIds["night-collective-edm-festival-preview"] },
      { user_id: elenaId, event_id: eventIds["kulturhaus-house-garden"] },
      { user_id: elenaId, event_id: eventIds["control-club-open-format-friday"] },
      { user_id: cristinaId, event_id: eventIds["sky-lounge-latin-terrace"] },
    ];
    for (const save of savesDefs) {
      const { error } = await admin.from("event_saves").upsert(save, { onConflict: "user_id,event_id" });
      if (error) throw new Error(`event_saves: ${error.message}`);
    }

    const reminderDefs = [
      { user_id: anaId, event_id: eventIds["control-club-techno-tonight"], remind_at: todayPlus(0, 20, 0) },
      { user_id: mihaiId, event_id: eventIds["night-collective-edm-festival-preview"], remind_at: todayPlus(18, 17, 0) },
    ];
    for (const reminder of reminderDefs) {
      const { error } = await admin.from("event_reminders").upsert(reminder, { onConflict: "user_id,event_id" });
      if (error) throw new Error(`event_reminders: ${error.message}`);
    }
    console.log(`   ${savesDefs.length} saves + ${reminderDefs.length} reminders created.`);

    console.log("9/9 · Creating analytics events...");
    const publishedEventIds = eventDefs
      .filter((e) => e.status === "published")
      .map((e) => eventIds[e.slug]);
    const analyticsUserIds = [null, null, anaId, mihaiId, elenaId, cristinaId];
    const typeWeights = [
      ["view", 6], ["click", 3], ["save", 2], ["share", 1], ["ticket_click", 2],
    ];
    const weightedTypes = typeWeights.flatMap(([type, weight]) => Array(weight).fill(type));

    const analyticsRows = [];
    for (const eventId of publishedEventIds) {
      const rowCount = 15 + Math.floor(Math.random() * 40);
      for (let i = 0; i < rowCount; i++) {
        analyticsRows.push({
          type: weightedTypes[Math.floor(Math.random() * weightedTypes.length)],
          entity_type: "event",
          entity_id: eventId,
          user_id: analyticsUserIds[Math.floor(Math.random() * analyticsUserIds.length)],
        });
      }
    }
    // Insert in batches to stay well under any request size limits.
    for (let i = 0; i < analyticsRows.length; i += 500) {
      const batch = analyticsRows.slice(i, i + 500);
      const { error } = await admin.from("analytics_events").insert(batch);
      if (error) throw new Error(`analytics_events: ${error.message}`);
    }
    console.log(`   ${analyticsRows.length} analytics events created.`);
  }

  console.log("\nDone. Demo accounts (all use the same password):");
  console.log(`  Password: ${PASSWORD}\n`);
  console.log("  Admin:");
  console.log(`    ${adminEmail}`);
  console.log("  Regular users:");
  console.log("    ana.popescu@demo.firefly.app / mihai.ionescu@demo.firefly.app / elena.dumitru@demo.firefly.app");
  console.log("    cristina.marin@demo.firefly.app — and andrei.stan@demo.firefly.app (suspended, for testing)");
  console.log("  Businesses (venue):");
  console.log("    control-club@demo.firefly.app (approved) · kulturhaus@demo.firefly.app (approved)");
  console.log("    sky-lounge@demo.firefly.app (approved) · subterra@demo.firefly.app (pending)");
  console.log("    green-hours@demo.firefly.app (suspended)");
  console.log("  Businesses (organizer):");
  console.log("    night-collective@demo.firefly.app (approved) · bass-therapy@demo.firefly.app (rejected)");
}

main().catch((err) => {
  console.error("\nSeed failed:", err);
  process.exit(1);
});
