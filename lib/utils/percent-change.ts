/** Month-over-month percent change helpers */

export type MonthWindow = {
  start: string;
  end: string;
};

export function getMonthWindows(now = new Date()): {
  current: MonthWindow;
  previous: MonthWindow;
} {
  const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  return {
    current: {
      start: currentStart.toISOString(),
      end: nextMonthStart.toISOString(),
    },
    previous: {
      start: previousStart.toISOString(),
      end: currentStart.toISOString(),
    },
  };
}

/**
 * Returns percent change from previous → current.
 * null when previous is 0 and current is 0 (no signal).
 * Infinity-like: when previous is 0 and current > 0, returns 100.
 */
export function percentChange(
  current: number,
  previous: number
): number | null {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export function formatDelta(delta: number | null | undefined): string | null {
  if (delta == null) return null;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta}%`;
}
