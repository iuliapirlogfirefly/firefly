import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ro"],
  defaultLocale: "en",
  localePrefix: "always",
  alternateLinks: false,
});

export type Locale = (typeof routing.locales)[number];
