import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
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
