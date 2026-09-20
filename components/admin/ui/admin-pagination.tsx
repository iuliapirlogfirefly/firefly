"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  ADMIN_PAGE_SIZE,
  buildAdminQuery,
  pageWindow,
  totalPages,
} from "@/lib/admin/pagination";

type Props = {
  pathname: string;
  params?: Record<string, string | number | undefined | null>;
  page: number;
  total: number;
  pageSize?: number;
  pageParam?: string;
};

export function AdminPagination({
  pathname,
  params = {},
  page,
  total,
  pageSize = ADMIN_PAGE_SIZE,
  pageParam = "page",
}: Props) {
  const t = useTranslations("admin");
  if (total <= pageSize) return null;

  const last = totalPages(total, pageSize);
  const current = Math.min(Math.max(1, page), last);
  const from = (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, total);
  const pages = pageWindow(current, last);

  const hrefFor = (nextPage: number) =>
    `${pathname}${buildAdminQuery({
      ...params,
      [pageParam]: nextPage,
    })}`;

  const linkClass = (active: boolean, disabled = false) =>
    `inline-flex min-w-8 items-center justify-center rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
      disabled
        ? "cursor-not-allowed text-muted-foreground/50"
        : active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
    }`;

  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {t("paginationShowing", { from, to, total })}
      </p>
      <nav className="flex flex-wrap items-center gap-1" aria-label={t("paginationNav")}>
        {current <= 1 ? (
          <span className={linkClass(false, true)}>{t("paginationPrev")}</span>
        ) : (
          <Link href={hrefFor(current - 1)} className={linkClass(false)}>
            {t("paginationPrev")}
          </Link>
        )}
        {pages.map((entry, index) =>
          entry === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="px-1 text-sm text-muted-foreground"
            >
              …
            </span>
          ) : (
            <Link
              key={entry}
              href={hrefFor(entry)}
              className={linkClass(entry === current)}
              aria-current={entry === current ? "page" : undefined}
            >
              {entry}
            </Link>
          )
        )}
        {current >= last ? (
          <span className={linkClass(false, true)}>{t("paginationNext")}</span>
        ) : (
          <Link href={hrefFor(current + 1)} className={linkClass(false)}>
            {t("paginationNext")}
          </Link>
        )}
      </nav>
    </div>
  );
}
