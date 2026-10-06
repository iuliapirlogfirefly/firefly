import type { MetadataRoute } from "next";
import { appOrigin } from "@/lib/seo/metadata";

const PRIVATE_PREFIXES = [
  "admin",
  "business",
  "auth",
  "profile",
  "saved",
  "login",
  "register",
];

export default function robots(): MetadataRoute.Robots {
  const disallow = [
    "/api",
    ...PRIVATE_PREFIXES.flatMap((prefix) => [
      `/${prefix}`,
      `/en/${prefix}`,
      `/ro/${prefix}`,
    ]),
  ];

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow,
    },
    sitemap: `${appOrigin()}/sitemap.xml`,
  };
}
