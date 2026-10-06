import type { Metadata, Viewport } from "next";
import { appOrigin } from "@/lib/seo/metadata";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(appOrigin()),
  title: "Firefly",
  description: "Nightlife discovery in Bucharest",
};

export const viewport: Viewport = {
  themeColor: "#141416",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
