/** Local editorial and event image paths served from /public/images. */
export const landingImages = {
  mapPreview: "/images/map-preview.png",
  editorialCrowd: "/images/editorial-crowd.png",
  editorialDj: "/images/editorial-dj.jpg",
  editorialStreet: "/images/editorial-street.jpg",
  editorialFriends: "/images/editorial-friends.png",
  editorialSign: "/images/editorial-sign.png",
  authCity: "/images/auth-city.png",
  /** Landing hero — polaroid frame */
  heroFrame: "/images/hero-frame-club.jpg",
  /** Landing hero — back photo */
  heroCrowd: "/images/hero-crowd-dj.jpg",
  /** Map section inset (top-right) */
  mapInset: "/images/map-inset.jpeg",
  /** How it works — step 01 */
  stepMap: "/images/step-city.jpg",
  /** How it works — step 03 */
  stepSave: "/images/step-save.jpg",
  /** Manifesto section */
  manifestoDj: "/images/manifesto-dj.jpg",
} as const;

export const eventImages = {
  event1: "/images/event-1.png",
  event2: "/images/event-2.png",
  event3: "/images/event-3.png",
  event4: "/images/event-4.png",
} as const;

export type LandingImageKey = keyof typeof landingImages;
