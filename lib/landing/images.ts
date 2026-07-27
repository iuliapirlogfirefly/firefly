/** Local editorial and event image paths served from /public/images. */
export const landingImages = {
  mapPreview: "/images/map-preview.png",
  editorialCrowd: "/images/editorial-crowd.png",
  editorialDj: "/images/editorial-dj.png",
  editorialStreet: "/images/editorial-street.png",
  editorialFriends: "/images/editorial-friends.png",
  editorialSign: "/images/editorial-sign.png",
  authJar: "/images/auth-jar.png",
  /** Landing hero — polaroid frame */
  heroFrame: "/images/hero-frame.jpeg",
  /** Landing hero — back photo */
  heroCrowd: "/images/hero-crowd.jpeg",
  /** Map section inset (top-right) */
  mapInset: "/images/map-inset.jpeg",
  /** How it works — step 01 */
  stepMap: "/images/step-map.jpg",
  /** How it works — step 03 */
  stepSave: "/images/step-save.jpeg",
  /** Manifesto section */
  manifestoDj: "/images/manifesto-dj.jpeg",
} as const;

export const eventImages = {
  event1: "/images/event-1.png",
  event2: "/images/event-2.png",
  event3: "/images/event-3.png",
  event4: "/images/event-4.png",
} as const;

export type LandingImageKey = keyof typeof landingImages;
