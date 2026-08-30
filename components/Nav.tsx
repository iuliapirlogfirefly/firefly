"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Heart, LayoutDashboard, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { usePrelaunch } from "@/components/launch-provider";
import { useSession } from "@/components/session-provider";
import { SignOutButton } from "@/components/ui/sign-out-button";
import { signOut } from "@/lib/actions/auth";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/map", label: "Map" },
  { href: "/calendar", label: "Calendar" },
  { href: "/feed", label: "Feed" },
  { href: "/missed", label: "Missed" },
] as const;

export function Nav() {
  const session = useSession();
  const isPrelaunch = usePrelaunch();
  const t = useTranslations("prelaunch");
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";
  const isLoggedIn = Boolean(session.userId);
  const isAdmin = session.role === "admin";
  const isBusiness =
    session.role === "business_venue" || session.role === "business_organizer";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-5">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inset-0 rounded-full bg-firefly animate-firefly-pulse" />
          </span>
          <span className="font-display text-xl tracking-tight-logo">firefly</span>
        </Link>

        {!isPrelaunch ? (
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-mono text-[11px] uppercase tracking-wider-2 text-foreground/70 transition-colors hover:text-firefly"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="flex items-center gap-2 sm:gap-3">
          {isLoggedIn ? (
            <>
              {!isPrelaunch ? (
                <Link
                  href="/profile#saved"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-firefly/30 text-firefly transition-colors hover:bg-firefly/10"
                  aria-label="Saved events"
                >
                  <Heart className="h-4 w-4" />
                </Link>
              ) : null}

              {isAdmin ? (
                <Link
                  href="/admin"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-firefly/30 text-firefly transition-colors hover:bg-firefly/10"
                  aria-label="Admin dashboard"
                >
                  <LayoutDashboard className="h-4 w-4" />
                </Link>
              ) : null}

              {isBusiness && !isPrelaunch ? (
                <Link
                  href="/business"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-firefly/30 text-firefly transition-colors hover:bg-firefly/10"
                  aria-label="Business dashboard"
                >
                  <LayoutDashboard className="h-4 w-4" />
                </Link>
              ) : null}

              <div
                ref={menuRef}
                className={`relative ${isPrelaunch ? "" : "hidden sm:block"}`}
              >
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/20 text-foreground/70 transition-colors hover:border-foreground/40 hover:text-foreground/90"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  aria-label="Account menu"
                >
                  <User className="h-4 w-4" />
                </button>

                {menuOpen ? (
                  <div
                    role="menu"
                    className="glass absolute right-0 top-full z-50 mt-2 min-w-[10rem] overflow-hidden rounded-2xl border border-firefly/10 py-1 shadow-2xl"
                  >
                    <Link
                      href="/profile"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider-2 text-foreground/70 transition-colors hover:bg-firefly/10 hover:text-firefly"
                    >
                      Account
                    </Link>
                    {isBusiness && !isPrelaunch ? (
                      <Link
                        href="/business"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider-2 text-foreground/70 transition-colors hover:bg-firefly/10 hover:text-firefly"
                      >
                        Business dashboard
                      </Link>
                    ) : null}
                    <form action={signOut.bind(null, locale)}>
                      <SignOutButton
                        role="menuitem"
                        className="w-full px-4 py-2.5 text-left font-mono text-[11px] uppercase tracking-wider-2 text-foreground/70 transition-colors hover:bg-firefly/10 hover:text-firefly"
                      />
                    </form>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <Link
              href="/auth"
              className={`${
                isPrelaunch ? "inline-flex" : "hidden sm:inline-flex"
              } rounded-full border border-firefly/30 px-4 py-2 font-mono text-[11px] uppercase tracking-wider-2 text-firefly transition-colors hover:bg-firefly/10`}
            >
              {isPrelaunch ? t("signIn") : "Sign in"}
            </Link>
          )}
          {isPrelaunch && !isLoggedIn ? (
            <Link
              href="/register"
              className="inline-flex rounded-full bg-firefly px-4 py-2 font-medium text-primary-foreground transition-all hover:firefly-glow hover:scale-[1.02]"
            >
              {t("createAccount")}
            </Link>
          ) : null}
          {!isPrelaunch ? (
            <Link
              href="/map"
              className="inline-flex rounded-full bg-firefly px-4 py-2 font-medium text-primary-foreground transition-all hover:firefly-glow hover:scale-[1.02]"
            >
              Open map
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
