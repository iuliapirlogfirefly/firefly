-- Seed Bucharest sample events (run after creating an admin user manually)
-- Example events for development — replace business_account_id with real IDs after setup

INSERT INTO events (
  slug, status, source, starts_at, ends_at, genre, event_type,
  price, ticket_url, cover_image_url, translations,
  is_promoted, promotion_intensity, lat, lng, address, venue_name
) VALUES
(
  'techno-night-control-club',
  'published', 'admin',
  (CURRENT_DATE + INTERVAL '1 day')::timestamptz + TIME '23:00',
  (CURRENT_DATE + INTERVAL '2 days')::timestamptz + TIME '06:00',
  'techno', 'club_night', 50.00, 'https://example.com/tickets',
  NULL,
  '{"en": {"title": "Techno Night at Control Club", "description": "Underground techno all night long."}, "ro": {"title": "Noapte Techno la Control Club", "description": "Techno underground toată noaptea."}}',
  true, 3,
  44.4378, 26.0966,
  'Strada Academiei 19, Bucharest', 'Control Club'
),
(
  'house-garden-kulturhaus',
  'published', 'admin',
  (CURRENT_DATE + INTERVAL '3 days')::timestamptz + TIME '22:00',
  (CURRENT_DATE + INTERVAL '4 days')::timestamptz + TIME '04:00',
  'house', 'party', 40.00, 'https://example.com/tickets2',
  NULL,
  '{"en": {"title": "House Garden Party", "description": "Open air house music experience."}, "ro": {"title": "Petrecere House în Grădină", "description": "Experiență house music în aer liber."}}',
  false, 1,
  44.4268, 26.1025,
  'Strada Blănari 21, Bucharest', 'Kulturhaus'
),
(
  'afro-house-rooftop',
  'published', 'admin',
  (CURRENT_DATE + INTERVAL '5 days')::timestamptz + TIME '20:00',
  (CURRENT_DATE + INTERVAL '5 days')::timestamptz + TIME '02:00',
  'afro_house', 'rooftop', 60.00, 'https://example.com/tickets3',
  NULL,
  '{"en": {"title": "Afro House Rooftop Sunset", "description": "Sunset session with afro house vibes."}, "ro": {"title": "Afro House Rooftop Apus", "description": "Sesiune la apus cu vibe-uri afro house."}}',
  true, 2,
  44.4412, 26.0898,
  'Calea Victoriei 155, Bucharest', 'Sky Lounge'
);

-- Recent "What you did missed" posts (party updates + chaos, last 48h)
INSERT INTO feed_posts (
  category, status, translations, media_url, published_at
) VALUES
(
  'party_updates',
  'published',
  '{"en": {"title": "Afterhours moved to Guesthouse", "description": "Doors closes at 5am. Continue on Academiei — list until 5:30."}, "ro": {"title": "Afterhours mutat la Guesthouse", "description": "Doors se închide la 05:00. Continui pe Academiei — listă până la 05:30."}}',
  '/images/hero-crowd-dj.jpg',
  now() - interval '90 minutes'
),
(
  'nightlife_chaos',
  'published',
  '{"en": {"title": "Rain vs rooftop: who won?", "description": "Sky Lounge stayed open. The crowd danced wet, nobody left."}, "ro": {"title": "Ploaia vs rooftop: cine a câștigat?", "description": "Sky Lounge a ținut deschis. Crowd-ul a dansat ud, nimeni nu a plecat."}}',
  '/images/editorial-street.jpg',
  now() - interval '7 hours'
),
(
  'party_updates',
  'published',
  '{"en": {"title": "Unannounced B2B at Expirat", "description": "Two headliners on the same decks after 3. No announcement, no encore — just the mix."}, "ro": {"title": "B2B neanunțat la Expirat", "description": "Doi headlineri pe aceeași masă după 3. Fără anunț, fără encore — doar mix."}}',
  '/images/editorial-dj.jpg',
  now() - interval '11 hours'
);
