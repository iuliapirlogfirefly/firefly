import type { UserRole } from "@/types";
import { isPrelaunchLockedPath } from "@/lib/launch/config";
import { isBusinessRole } from "./session";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/auth",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/map",
  "/calendar",
  "/feed",
  "/missed",
  "/events",
  "/unsubscribe/newsletter",
];

const USER_PATHS = ["/saved", "/profile"];

const BUSINESS_PATH_PREFIX = "/business";
const ADMIN_PATH_PREFIX = "/admin";

export function stripLocale(pathname: string): string {
  const match = pathname.match(/^\/(en|ro)(\/.*)?$/);
  if (!match) return pathname;
  return match[2] || "/";
}

export function isPublicPath(pathname: string): boolean {
  const path = stripLocale(pathname);
  if (PUBLIC_PATHS.includes(path)) return true;
  if (path.startsWith("/events/")) return true;
  if (path.startsWith("/unsubscribe/")) return true;
  return false;
}

export function isUserPath(pathname: string): boolean {
  const path = stripLocale(pathname);
  return USER_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

export function isBusinessPath(pathname: string): boolean {
  const path = stripLocale(pathname);
  return path.startsWith(BUSINESS_PATH_PREFIX);
}

export function isAdminPath(pathname: string): boolean {
  const path = stripLocale(pathname);
  return path.startsWith(ADMIN_PATH_PREFIX);
}

export function canAccessPath(
  pathname: string,
  role: UserRole | "guest",
  isSuspended = false,
  prelaunchActive = false
): { allowed: boolean; redirect?: string } {
  const path = stripLocale(pathname);

  if (isSuspended) {
    if (path === "/auth" || path.startsWith("/auth/")) {
      return { allowed: true };
    }
    return { allowed: false, redirect: "/auth?reason=suspended" };
  }

  if (prelaunchActive && role !== "admin" && isPrelaunchLockedPath(path)) {
    return { allowed: false, redirect: "/" };
  }

  if (isPublicPath(pathname)) {
    return { allowed: true };
  }

  if (role === "guest") {
    if (isUserPath(pathname) || isBusinessPath(pathname) || isAdminPath(pathname)) {
      return { allowed: false, redirect: "/login" };
    }
    return { allowed: true };
  }

  if (isAdminPath(pathname)) {
    if (role !== "admin") {
      return { allowed: false, redirect: "/" };
    }
    return { allowed: true };
  }

  if (isBusinessPath(pathname)) {
    if (!isBusinessRole(role)) {
      return { allowed: false, redirect: "/" };
    }
    return { allowed: true };
  }

  if (isUserPath(pathname)) {
    return { allowed: true };
  }

  return { allowed: true };
}
