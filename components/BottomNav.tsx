"use client";

import {
  Calendar,
  Home,
  LayoutGrid,
  MapPin,
  Sparkles,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { usePrelaunch } from "@/components/launch-provider";

const items = [
  { href: "/", key: "home", icon: Home },
  { href: "/map", key: "map", icon: MapPin },
  { href: "/calendar", key: "calendar", icon: Calendar },
  { href: "/feed", key: "feed", icon: LayoutGrid },
  { href: "/missed", key: "missed", icon: Sparkles },
  { href: "/profile", key: "account", icon: User },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();
  const isPrelaunch = usePrelaunch();
  const t = useTranslations("nav");
  const visibleItems = isPrelaunch
    ? items.filter((item) => item.href === "/" || item.href === "/profile")
    : items;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-firefly/10 bg-background/90 backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-0.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {visibleItems.map(({ href, key, icon: Icon }) => {
          const active = isActive(pathname, href);

          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-12 flex-col items-center gap-1 rounded-xl px-1.5 py-2 transition-colors ${
                active ? "text-firefly" : "text-foreground/50 hover:text-foreground/80"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-mono text-[7px] uppercase tracking-wider-2">
                {t(key)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
