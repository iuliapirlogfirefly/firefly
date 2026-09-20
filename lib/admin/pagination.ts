export const ADMIN_PAGE_SIZE = 25;

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function firstSearchParam(
  value: string | string[] | undefined
): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function rangeForPage(page: number, pageSize = ADMIN_PAGE_SIZE) {
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * pageSize;
  return { from, to: from + pageSize - 1, pageSize, page: safePage };
}

export function totalPages(total: number, pageSize = ADMIN_PAGE_SIZE) {
  return Math.max(1, Math.ceil(Math.max(0, total) / pageSize));
}

export function clampPage(
  page: number,
  total: number,
  pageSize = ADMIN_PAGE_SIZE
) {
  if (total <= 0) return 1;
  return Math.min(Math.max(1, page), totalPages(total, pageSize));
}

export function emptyPage<T>(
  page = 1,
  pageSize = ADMIN_PAGE_SIZE
): Paginated<T> {
  return { items: [], total: 0, page: Math.max(1, page), pageSize };
}

export function paginateItems<T>(
  items: T[],
  page: number,
  pageSize = ADMIN_PAGE_SIZE
): Paginated<T> {
  const total = items.length;
  const safePage = clampPage(page, total, pageSize);
  const { from, to } = rangeForPage(safePage, pageSize);
  return {
    items: items.slice(from, to + 1),
    total,
    page: safePage,
    pageSize,
  };
}

export function toPaginated<T>(
  items: T[],
  total: number,
  page: number,
  pageSize = ADMIN_PAGE_SIZE
): Paginated<T> {
  return {
    items,
    total: total ?? 0,
    page: Math.max(1, page),
    pageSize,
  };
}

export function ilikeContains(q: string): string | null {
  const cleaned = q
    .trim()
    .replace(/[%_,.()"'\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return null;
  return `%${cleaned}%`;
}

export function pageWindow(
  current: number,
  last: number,
  radius = 1
): Array<number | "ellipsis"> {
  if (last <= 7) {
    return Array.from({ length: last }, (_, i) => i + 1);
  }

  const set = new Set<number>([1, last, current]);
  for (let offset = 1; offset <= radius; offset += 1) {
    set.add(current - offset);
    set.add(current + offset);
  }

  const sorted = [...set]
    .filter((page) => page >= 1 && page <= last)
    .sort((a, b) => a - b);

  const result: Array<number | "ellipsis"> = [];
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("ellipsis");
    result.push(sorted[i]);
  }
  return result;
}

export function buildAdminQuery(
  params: Record<string, string | number | undefined | null>
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    const text = String(value);
    if ((key === "page" || key === "subsPage") && text === "1") continue;
    search.set(key, text);
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}
