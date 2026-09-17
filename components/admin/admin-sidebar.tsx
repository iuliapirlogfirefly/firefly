"use client";

import { Link, usePathname } from "@/i18n/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  Mail,
  Megaphone,
  Menu,
  MessageSquare,
  Newspaper,
  Package,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { AdminPendingCounts } from "@/lib/queries/admin";

const navItems = [
  { href: "/admin", key: "overview", icon: LayoutDashboard, countKey: null },
  { href: "/admin/events", key: "events", icon: CalendarDays, countKey: "pendingEvents" as const },
  { href: "/admin/posts", key: "posts", icon: Newspaper, countKey: "pendingPosts" as const },
  { href: "/admin/users", key: "users", icon: Users, countKey: "pendingBusinesses" as const },
  { href: "/admin/messages", key: "messages", icon: MessageSquare, countKey: "unreadMessages" as const },
  { href: "/admin/promotions", key: "promotions", icon: Megaphone, countKey: null },
  { href: "/admin/deliveries", key: "deliveries", icon: Package, countKey: "pendingDeliveries" as const },
  { href: "/admin/newsletters", key: "newsletters", icon: Mail, countKey: null },
  { href: "/admin/settings", key: "settings", icon: Settings, countKey: null },
] as const;

type Props = {
  counts: AdminPendingCounts;
};

export function AdminSidebar({ counts }: Props) {
  const pathname = usePathname();
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <>
      <div className="border-b border-border px-5 py-5">
        <Link href="/admin" className="font-heading text-lg font-semibold text-foreground">
          {tCommon("appName")}
        </Link>
        <p className="mt-0.5 text-xs text-muted-foreground">{t("roleLabel")}</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ href, key, icon: Icon, countKey }) => {
          const count = countKey ? counts[countKey] : 0;
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-surface-2 font-medium text-foreground"
                  : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0" />
                {t(key)}
              </span>
              {count > 0 ? (
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
                  {count}
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
