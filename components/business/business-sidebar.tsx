"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { usePrelaunch } from "@/components/launch-provider";
import {
  CalendarDays,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  Menu,
  Newspaper,
  Settings,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

const navItems = [
  { href: "/business", labelKey: "overview", icon: LayoutDashboard },
  { href: "/business/events", labelKey: "events", icon: CalendarDays },
  { href: "/business/posts", labelKey: "posts", icon: Newspaper },
  { href: "/business/promotions", labelKey: "promotions", icon: Megaphone },
  { href: "/business/settings", labelKey: "settings", icon: Settings },
  { href: "/business/contact", labelKey: "contact", icon: LifeBuoy },
] as const;

type Props = {
  venueName: string;
};

export function BusinessSidebar({ venueName }: Props) {
  const pathname = usePathname();
  const isPrelaunch = usePrelaunch();
  const t = useTranslations("business");
  const tPrelaunch = useTranslations("prelaunch");
  const tCommon = useTranslations("common");
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/business") return pathname === "/business";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <>
      <div className="border-b border-border px-5 py-5">
        <Link
          href="/business"
          className="font-heading text-lg font-semibold text-foreground"
        >
          {tCommon("appName")}
        </Link>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {venueName}
        </p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ href, labelKey, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-surface-2 font-medium text-foreground"
                  : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{t(labelKey)}</span>
              {href === "/business/promotions" && isPrelaunch ? (
                <span className="rounded-full bg-firefly/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider-2 text-firefly">
                  {tPrelaunch("promotionsSoon")}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface-1 lg:hidden"
        aria-label={tCommon("openMenu")}
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label={tCommon("closeMenu")}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col border-r border-border bg-background transition-transform lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-2 lg:hidden"
          aria-label={tCommon("closeMenu")}
        >
          <X className="h-4 w-4" />
        </button>
        {sidebarContent}
      </aside>
    </>
  );
}
